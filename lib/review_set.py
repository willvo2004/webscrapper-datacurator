import psycopg2
import pandas as pd

connection = psycopg2.connect(user="williamvo", dbname="insight", host="localhost")

cursor = connection.cursor()

df = pd.read_json("../google-review-data.json")
filter = df.dropna(subset=["owner_response"])

owner_response = filter["owner_response"]
clear_null = df[df["generated_response"] != "null"]
generated_response = clear_null["generated_response"]

print(owner_response)
print(generated_response)
