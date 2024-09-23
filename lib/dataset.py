import psycopg2

connection = psycopg2.connect(user="williamvo", host="localhost", dbname="insight")

cursor = connection.cursor()

cursor.execute("SELECT insight, index FROM insights ORDER BY index ASC")
insights = cursor.fetchall()

cursor.execute("SELECT description, index FROM reviews ORDER BY index ASC")
reviews = cursor.fetchall()


def pair_data(insight, review):
    instruction = "Provide a business insight based on the sentiment of this review"
    input = review[0]
    output = insight[0]
    index_pair = f"{review[1]} : {insight[1]}"

    try:
        cursor.execute(
            """
            INSERT INTO "input-output" (instruction, input, output, index_pair)
            VALUES (%s, %s, %s, %s)
            """,
            (instruction, input, output, index_pair),
        )
    except Exception as e:
        print(e)


for insight, review in zip(insights, reviews):
    pair_data(insight, review)

# Commit the transaction and close connection
connection.commit()
cursor.close()
connection.close()
