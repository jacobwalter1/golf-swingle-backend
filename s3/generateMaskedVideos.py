"""
Improved Video masking pipeline for golf swing reveal game
Requires: opencv-python, rembg, numpy, scipy
Install: pip install opencv-python rembg numpy scipy
"""

import cv2
import numpy as np
from rembg import remove, new_session
from pathlib import Path

class GolfVideoMasker:
    def __init__(self, input_video, alpha_threshold=5, dilation_iterations=3):
        """
        Args:
            input_video: Path to input video
            alpha_threshold: Lower = more inclusive (catches more of person/club)
            dilation_iterations: Number of times to expand the mask (helps fill gaps)
        """
        self.input_video = input_video
        self.cap = cv2.VideoCapture(input_video)
        self.fps = int(self.cap.get(cv2.CAP_PROP_FPS))
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.alpha_threshold = alpha_threshold
        self.dilation_iterations = dilation_iterations
        
        # Create rembg session with human segmentation model (better for sports)
        print("Loading u2net_human_seg model (optimized for sports/people)...")
        self.rembg_session = new_session("u2net_human_seg")
        
        # Store previous mask for temporal smoothing
        self.prev_mask = None
    
    def cleanup(self):
        """Release all video capture resources"""
        if hasattr(self, 'cap') and self.cap is not None:
            self.cap.release()
            self.cap = None
        
    def process_mask(self, alpha, temporal_smoothing=True):
        """
        Enhanced mask processing with morphological operations and temporal smoothing
        
        Args:
            alpha: Alpha channel from rembg
            temporal_smoothing: Use previous frame to smooth mask transitions
        """
        # Create initial binary mask with lower threshold
        mask = alpha > self.alpha_threshold
        
        # Morphological closing: fills small holes and gaps
        # This helps connect the club to the person
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask.astype(np.uint8), cv2.MORPH_CLOSE, kernel)
        
        # Temporal smoothing: blend with previous frame
        if temporal_smoothing and self.prev_mask is not None:
            # Weighted average: 70% current, 30% previous
            # This reduces flickering and fills gaps
            mask_float = mask.astype(float)
            prev_float = self.prev_mask.astype(float)
            smoothed = 0.7 * mask_float + 0.3 * prev_float
            mask = (smoothed > 0.5).astype(np.uint8)
        
        # Store for next frame
        self.prev_mask = mask.copy()
        
        return mask.astype(bool)
    
    def create_level_1_background(self, output_path):
        """Level 1: Show background, keep golfer as silhouette"""
        print("Creating Level 1: Background reveal with person masked...")
        
        cap = cv2.VideoCapture(self.input_video)
        # Use H.264 codec for browser compatibility
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        out = cv2.VideoWriter(output_path, fourcc, self.fps, (self.width, self.height))
        
        frame_count = 0
        self.prev_mask = None  # Reset
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            result = remove(frame, session=self.rembg_session)
            alpha = result[:, :, 3]
            
            # Process mask with temporal smoothing
            mask = self.process_mask(alpha, temporal_smoothing=True)
            
            # Start with original frame
            output = frame.copy()
            
            # Replace person with black silhouette
            output[mask] = [0, 0, 0]
            
            out.write(output)
            frame_count += 1
            if frame_count % 30 == 0:
                print(f"  Processed {frame_count} frames...")
        
        cap.release()
        out.release()
        print(f"Level 1 complete: {output_path}")
    
    def detect_head_region(self, mask):
        """
        Detect head region from person segmentation mask.
        Works from any angle (front, side, or back view).
        
        Args:
            mask: Binary mask of person from rembg
            
        Returns:
            (x, y, w, h) bounding box of head region, or None if not detected
        """
        if not mask.any():
            return None
        
        # Find all person pixels
        person_points = np.where(mask)
        if len(person_points[0]) == 0:
            return None
        
        # Get bounding box of entire person
        y_min, y_max = person_points[0].min(), person_points[0].max()
        x_min, x_max = person_points[1].min(), person_points[1].max()
        
        person_height = y_max - y_min
        person_width = x_max - x_min
        
        # Head is approximately top 20-25% of person height
        # Adjust this ratio based on your videos
        head_height_ratio = 0.20  # Head is ~20% of total height
        head_height = int(person_height * head_height_ratio)
        
        # Head region: top portion of person
        head_y = y_min
        head_x = x_min
        head_w = person_width
        head_h = head_height
        
        # Add some padding to ensure full coverage
        padding = int(head_height * 0.20)  # 20% padding
        head_y = max(0, head_y - padding)
        head_x = max(0, head_x - padding)
        head_w = min(self.width - head_x, head_w + 2 * padding)
        head_h = min(self.height - head_y, head_h + 2 * padding)
        
        return (head_x, head_y, head_w, head_h)
    
    def create_level_2_blur_face(self, output_path):
        """Level 2: Full video but with entire head blurred (works from any angle)"""
        print("Creating Level 2: Head blurred (using segmentation-based detection)...")
        
        cap = cv2.VideoCapture(self.input_video)
        # Use H.264 codec for browser compatibility
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        out = cv2.VideoWriter(output_path, fourcc, self.fps, (self.width, self.height))
        
        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Use rembg to detect person
            result = remove(frame, session=self.rembg_session)
            alpha = result[:, :, 3]
            
            # Create person mask
            person_mask = alpha > self.alpha_threshold
            
            # Detect head region from person mask
            head_bbox = self.detect_head_region(person_mask)
            
            if head_bbox is not None:
                x, y, w, h = head_bbox
                
                head_region = frame[y:y+h, x:x+w]
                if head_region.size > 0: 
                    blurred_head = cv2.GaussianBlur(head_region, (99, 99), 30)
                    frame[y:y+h, x:x+w] = blurred_head
            
            out.write(frame)
            frame_count += 1
            if frame_count % 30 == 0:
                print(f"  Processed {frame_count} frames...")
        
        cap.release()
        out.release()
        print(f"Level 2 complete: {output_path}")
    
    def create_level_3_original(self, output_path):
        """Level 3: Original video"""
        print("Creating Level 3: Original video...")
        import shutil
        shutil.copy(self.input_video, output_path)
        print(f"Level 3 complete: {output_path}")
    
    def process_all_levels(self, output_dir="output"):
        """
        Process video into all 3 levels
        
        Args:
            output_dir: Output directory
        """
        Path(output_dir).mkdir(exist_ok=True)
        
        base_name = Path(self.input_video).stem
        
        # Create subdirectory for this video
        video_output_dir = Path(output_dir) / base_name
        video_output_dir.mkdir(exist_ok=True)
        
        levels = [
            (f"{output_dir}/{base_name}/level1.mp4", 
             self.create_level_1_background),
            (f"{output_dir}/{base_name}/level2.mp4", 
             self.create_level_2_blur_face),
            (f"{output_dir}/{base_name}/original.mp4", 
             self.create_level_3_original),
        ]
        
        for output_path, method in levels:
            try:
                method(output_path)
            except Exception as e:
                print(f"Error processing {output_path}: {e}")
                import traceback
                traceback.print_exc()
        
        print("\n✅ All levels complete!")

# Usage example
if __name__ == "__main__":
    # Get all video files from the videos_to_process folder
    video_folder = Path("videos_to_process")
    
    videos_to_process = []
    videos_to_process.extend(video_folder.glob("*.mp4"))
    
    if not videos_to_process:
        print("❌ No videos found in 'videos_to_process' folder!")
        print("   Make sure the folder exists and contains video files.")
        exit(1)
    
    print(f"Found {len(videos_to_process)} video(s) to process:")
    for vid in videos_to_process:
        print(f"  - {vid.name}")
    print()
    
    # Ensure completed-videos directory exists
    completed_folder = Path("completed-videos")
    completed_folder.mkdir(exist_ok=True)
    
    # Process each video
    for video_path in videos_to_process:
        print(f"\n{'='*60}")
        print(f"Processing: {video_path.name}")
        print(f"{'='*60}\n")
        
        # Create masker with tunable parameters
        masker = GolfVideoMasker(
            str(video_path),
            alpha_threshold=8,      # Lower = more inclusive (1-20, default 5)
            dilation_iterations=2    # Higher = thicker mask (1-5, default 3)
        )
        
        # Process all levels
        masker.process_all_levels(
            output_dir="videos"
        )
        
        # Cleanup video resources before moving file
        masker.cleanup()
        
        # Small delay to ensure Windows releases file handles
        import time
        time.sleep(0.5)
        
        # Move processed video to completed-videos folder
        destination = completed_folder / video_path.name
        print(f"\n📦 Moving {video_path.name} to completed-videos folder...")
        try:
            video_path.rename(destination)
            print(f"✅ Moved to: {destination}")
        except PermissionError:
            print(f"⚠️ Could not move file (still in use). Waiting 2 seconds...")
            time.sleep(2)
            video_path.rename(destination)
            print(f"✅ Moved to: {destination}")
        
        
    
    print("\n" + "="*60)
    print(f"✅ ALL {len(videos_to_process)} VIDEOS COMPLETE!")
    print("="*60)
    

 
