import pandas as pd
from nltk.sentiment.vader import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()
df = pd.read_json("google-review-data-500-raw.json")

# a pandas series
description_column = df["description"]
compound_list = []
sentiment_category = []

for description in description_column:
    sentiment_score = analyzer.polarity_scores(description)
    compound = sentiment_score["compound"]
    if compound >= 0.05:
        sentiment_category.append("positive")

    elif compound <= -0.05:
        sentiment_category.append("negative")
    else:
        sentiment_category.append("neutral")
    compound_list.append(compound)

df["compound_score"] = compound_list
df["sentiment"] = sentiment_category

df.to_json(path_or_buf="google-review-data-500-raw.json", indent=4, orient="records")
