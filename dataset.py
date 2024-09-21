import pandas as pd

df = pd.read_json("google-review-data.json")

review_column = df["description"]
owner_response_column = df["owner_response"]
generated_response_column = df["generated_response"]
sentiment_column = df["sentiment"]
