import pandas as pd
import json
import os
import shutil

# Path to the downloaded dataset
dataset_path = r"C:\Users\apurv\.cache\kagglehub\datasets\vishalsubbiah\pokemon-images-and-types\versions\4"
csv_file = os.path.join(dataset_path, "pokemon.csv")

# Read the CSV file
df = pd.read_csv(csv_file)

print(f"Dataset loaded with {len(df)} Pokemon")
print(f"Columns: {list(df.columns)}")

# Create a data directory in the project
data_dir = "src/data"
os.makedirs(data_dir, exist_ok=True)

# Process the data for the React app
pokemon_data = []

# Emoji mapping for Pokemon types (simplified)
type_emojis = {
    'Grass': '🌱',
    'Fire': '🔥',
    'Water': '💧',
    'Electric': '⚡',
    'Psychic': '🔮',
    'Ice': '❄️',
    'Dragon': '🐉',
    'Dark': '🌑',
    'Fairy': '✨',
    'Fighting': '🥊',
    'Poison': '☠️',
    'Ground': '🌍',
    'Flying': '🦅',
    'Bug': '🐛',
    'Rock': '🪨',
    'Ghost': '👻',
    'Steel': '⚙️',
    'Normal': '⚪'
}

# Color mapping for Pokemon types
type_colors = {
    'Grass': 'from-green-400 to-emerald-500',
    'Fire': 'from-orange-400 to-red-500',
    'Water': 'from-blue-400 to-cyan-500',
    'Electric': 'from-yellow-400 to-orange-500',
    'Psychic': 'from-purple-400 to-pink-500',
    'Ice': 'from-blue-200 to-cyan-300',
    'Dragon': 'from-indigo-500 to-purple-600',
    'Dark': 'from-gray-600 to-gray-800',
    'Fairy': 'from-pink-300 to-purple-400',
    'Fighting': 'from-red-500 to-orange-600',
    'Poison': 'from-purple-500 to-pink-600',
    'Ground': 'from-yellow-600 to-orange-700',
    'Flying': 'from-sky-400 to-blue-500',
    'Bug': 'from-green-500 to-lime-600',
    'Rock': 'from-gray-500 to-gray-700',
    'Ghost': 'from-purple-600 to-indigo-700',
    'Steel': 'from-gray-400 to-gray-600',
    'Normal': 'from-gray-300 to-gray-500'
}

for index, row in df.iterrows():
    name = row['Name']
    type1 = row['Type1']
    type2 = row['Type2'] if pd.notna(row['Type2']) else None
    evolution = row['Evolution'] if pd.notna(row['Evolution']) else None

    # Create a description based on types
    type_text = type1
    if type2:
        type_text += f" and {type2}"

    description = f"A {type_text.lower()} type Pokemon known for its unique abilities and characteristics."

    # Get emoji for primary type
    emoji = type_emojis.get(type1, '🐾')

    # Get color for primary type
    color = type_colors.get(type1, 'from-gray-400 to-gray-600')

    pokemon_entry = {
        'id': name.lower(),
        'name': name.capitalize(),
        'emoji': emoji,
        'description': description,
        'type': type1,
        'secondaryType': type2,
        'color': color,
        'evolution': evolution,
        'generation': 1  # We'll need to add generation data
    }

    pokemon_data.append(pokemon_entry)

# Save as JSON for the React app
json_file = os.path.join(data_dir, "pokemon_data.json")
with open(json_file, 'w', encoding='utf-8') as f:
    json.dump(pokemon_data, f, indent=2, ensure_ascii=False)

print(f"Processed {len(pokemon_data)} Pokemon and saved to {json_file}")

# Copy images directory if it exists
images_dir = os.path.join(dataset_path, "images")
if os.path.exists(images_dir):
    dest_images_dir = os.path.join(data_dir, "pokemon_images")
    if os.path.exists(dest_images_dir):
        shutil.rmtree(dest_images_dir)
    shutil.copytree(images_dir, dest_images_dir)
    print(f"Copied images to {dest_images_dir}")
else:
    print("No images directory found")

print("Pokemon data processing complete!")
print(f"Sample Pokemon: {pokemon_data[0] if pokemon_data else 'None'}")