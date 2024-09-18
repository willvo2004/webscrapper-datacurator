from openai import OpenAI
import pandas as pd
from nltk.sentiment.vader import SentimentIntensityAnalyzer

client = OpenAI()
analyzer = SentimentIntensityAnalyzer()
df = pd.read_json("google-review-data-500-raw.json")

# a pandas series
description_column = df["description"]
reviewer_information = df["reviewer_info"]
reviewer_list = reviewer_information.tolist()


def generate_response(description, reviewer):
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


# TODO: fix sentiment functions later
compound_list = []
sentiment_category = []


def analyze_sentiment(description):
    sentiment_score = analyzer.polarity_scores(description)
    compound = sentiment_score["compound"]
    if compound >= 0.05:
        sentiment_category.append("positive")

    elif compound <= -0.05:
        sentiment_category.append("negative")
    else:
        sentiment_category.append("neutral")

    return sentiment_category


def analyze_compound(description):
    sentiment_score = analyzer.polarity_scores(description)
    compound_list.append(sentiment_score)

    return compound_list


# df["compound_score"] = list(map(analyze_compound, description_column))
# df["sentiment"] = list(map(analyze_sentiment, description_column))
df["generated_response"] = list(
    map(generate_response, description_column, reviewer_list)
)

df.to_json(path_or_buf="google-review-data-500-raw.json", indent=4, orient="records")
