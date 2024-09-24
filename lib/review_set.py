import psycopg2
import pandas as pd
from sqlalchemy import create_engine

connection_string = "postgresql://williamvo@localhost:5432/response"
db = create_engine(connection_string)
conn = db.connect()

df = pd.read_json("../google-review-data.json")
filter = df.dropna(subset=["owner_response"])

# no generated responses here
owner_positive_reviews = filter[filter["sentiment"] == "positive"]
owner_negative_reviews = filter[filter["sentiment"] == "negative"]
owner_neutral_reviews = filter[filter["sentiment"] == "neutral"]


gfilter = df[df["generated_response"] != "null"]


generated_positive_reviews = gfilter[gfilter["sentiment"] == "positive"]
generated_negative_reviews = gfilter[gfilter["sentiment"] == "negative"]
generated_neutral_reviews = gfilter[gfilter["sentiment"] == "neutral"]


# combine human responses and generated responses
def grab_neutral():
    human_response = owner_neutral_reviews["owner_response"]
    generated_response = generated_neutral_reviews["generated_response"]

    responses = human_response.combine_first(generated_response)
    responses.to_sql("neutral_response", db, if_exists="replace")
    return responses


def grab_negative():
    human_response = owner_negative_reviews["owner_response"]
    generated_response = generated_negative_reviews["generated_response"]

    responses = human_response.combine_first(generated_response)
    responses.to_sql("negative_response", db, if_exists="replace")
    return responses


def grab_positive():
    human_response = owner_positive_reviews["owner_response"]
    generated_response = generated_positive_reviews["generated_response"]

    responses = human_response.combine_first(generated_response)
    responses.to_sql("positive_response", db, if_exists="replace")
    return responses


connection = psycopg2.connect(connection_string)
connection.autocommit = True
cursor = connection.cursor()

x = grab_neutral()
y = grab_negative()
z = grab_positive()
print(x)
