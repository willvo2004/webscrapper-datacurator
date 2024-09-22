from openai import OpenAI
import pandas as pd
from nltk.sentiment.vader import SentimentIntensityAnalyzer

client = OpenAI()
analyzer = SentimentIntensityAnalyzer()
df = pd.read_json("google-review-data-500-raw.json")

# a pandas series
description_column = df["description"]
reviewer_information = df["reviewer_info"]
owner_response = df["owner_response"]
reviewer_list = reviewer_information.tolist()


def generate_response(description, reviewer, owner_response):
    if owner_response or owner_response is not None:
        return "null"

    name = reviewer["name"]
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Generate appropiate responses to google reviews. If you think the review is negative, try to address its critisims and promise to improve on them. And if you think the review is a bit vague, keep your response to one sentence. Keep every resposne concise.",
            },
            {
                "role": "user",
                "content": f"{name} wrote: {description}",
            },
        ],
        max_tokens=100,
    )
    print(completion.choices[0].message.content)
    return completion.choices[0].message.content


def analyze_sentiment(description):
    sentiment_score = analyzer.polarity_scores(description)
    compound = sentiment_score["compound"]
    if compound >= 0.05:
        return "positive"

    elif compound <= -0.05:
        return "negative"
    else:
        return "neutral"


def analyze_compound(description):
    sentiment_score = analyzer.polarity_scores(description)
    return sentiment_score


df["compound_score"] = list(map(analyze_compound, description_column))
df["sentiment"] = list(map(analyze_sentiment, description_column))
df["generated_response"] = list(
    map(generate_response, description_column, reviewer_list, owner_response)
)

df.to_json(path_or_buf="google-review-data-500-raw.json", indent=4, orient="records")
