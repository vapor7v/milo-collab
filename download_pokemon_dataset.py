import kagglehub

# Download latest version
path = kagglehub.dataset_download("vishalsubbiah/pokemon-images-and-types")

print("Path to dataset files:", path)

# List the files in the dataset
import os
print("\nFiles in dataset:")
for file in os.listdir(path):
    print(f"- {file}")

# Read and display the CSV file if it exists
import pandas as pd

csv_files = [f for f in os.listdir(path) if f.endswith('.csv')]
if csv_files:
    csv_path = os.path.join(path, csv_files[0])
    print(f"\nReading CSV file: {csv_files[0]}")
    df = pd.read_csv(csv_path)
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print("\nFirst 5 rows:")
    print(df.head())
else:
    print("No CSV files found in the dataset")