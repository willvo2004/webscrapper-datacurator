import pandas as pd
import psycopg2
from openai import OpenAI

connection = psycopg2.connect("dbname=insight user=williamvo host=localhost")
cursor = connection.cursor()

df = pd.read_json("google-review-data.json")
client = OpenAI()

# Filter rows where sentiment is 'negative'
negative_reviews = df[df["sentiment"] == "negative"]

# Select the review descriptions
negative_descriptions = negative_reviews["description"]

cursor.executemany(
    """
    INSERT INTO reviews (review)
    VALUES (%s)
    """,
    negative_descriptions,
)

# Display the negative descriptions
print(negative_descriptions)


def generate_insight(description):
    completions = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Whatever"},
            {"role": "user", "content": f"{description}"},
        ],
        max_tokens=150,
    )
