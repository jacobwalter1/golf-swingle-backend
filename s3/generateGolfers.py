import json

def process_json(input_file, output_file):
    try:
        # Read JSON file
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        outputData = []
        for player in data.get('players', []):
            golfer = {
                "id": player.get("id", ""),
                "playerId": player.get("firstName", "").lower() + "-" + player.get("lastName", "").lower(),
                "firstName": player.get("firstName", ""),
                "lastName": player.get("lastName", ""),
                "fullName": player.get("firstName", "") + " " + player.get("lastName", ""),
                "isActive": player.get("isActive", False),
                "country": player.get("country", ""),
                "turnedPro": player.get("playerBio", {}).get("turnedPro", ""),
                "education": player.get("playerBio", {}).get("education", ""),
                "age": player.get("playerBio", {}).get("age", 0),
                "headshotUrl": player.get("headshot", "")
            }
            outputData.append(golfer)
            
        # Write output JSON file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(outputData, f, indent=4)
        
    except FileNotFoundError:
        print(f"❌ Error: {input_file} not found")
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in {input_file}: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
        
        

# Usage
if __name__ == "__main__":
    process_json('input.json', 'golfers.json')