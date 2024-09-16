import pandas as pd
from nltk.sentiment.vader import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()
df = pd.read_csv("review_data_12k.csv")

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
df["sentiment_category"] = sentiment_category

df.to_csv("review_data_12k.csv", index=False)
