from flask import Flask, request
from nltk.sentiment.vader import SentimentIntensityAnalyzer

app = Flask(__name__)


@app.route("/sentiment")
def sentiment_analysis():
    query = request.args.get("text")
    analyzer = SentimentIntensityAnalyzer()

    return analyzer.polarity_scores(query), 200
