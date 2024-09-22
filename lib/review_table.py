from sqlalchemy import create_engine
import pandas as pd
import psycopg2

connection_string = "postgresql://williamvo@localhost:5432/insight"
db = create_engine(connection_string)
conn = db.connect()

df = pd.read_json("google-review-data.json")

# Filter rows where sentiment is 'negative'
negative_reviews = df[df["sentiment"] == "negative"]

# Select the review descriptions
negative_descriptions = negative_reviews["description"]
negative_descriptions.to_sql("review", db, if_exists="replace")
conn = psycopg2.connect(connection_string)
conn.autocommit = True
cursor = conn.cursor()

# Display the negative descriptions
print(negative_descriptions)
