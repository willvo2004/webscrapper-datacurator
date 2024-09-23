from openai import OpenAI
import asyncio
import asyncpg

client = OpenAI()


def format_records(record):
    return dict(record)


async def connect():
    connection = await asyncpg.connect(
        user="williamvo", database="insight", host="localhost"
    )
    return connection


async def generate_insight(conn, review, index):
    completions = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Generate a business insight based on the customer's feedback. If the review is too vague or does not provide clear critcism, don't provide an insight",
            },
            {"role": "user", "content": f"This person wrote: {review}"},
        ],
        max_tokens=120,
    )
    response = completions.choices[0].message.content
    print(response)
    try:
        await conn.execute(
            """ 
                INSERT INTO insights (index, insight)
                VALUES ($1, $2)""",
            index,
            response,
        )
    except Exception as e:
        print(f"Error inserting into DB: {e}")


async def grab_rows(conn):
    rows = await conn.fetch("SELECT * FROM reviews WHERE id > 437")
    return rows


async def queue_coroutine():
    connection = await connect()
    record_list = await grab_rows(connection)
    reviews = list(map(format_records, record_list))

    tasks = []
    for review in reviews:
        review_text = review["description"]
        review_index = review["index"]

        async with asyncpg.create_pool(
            user="williamvo", database="insight", host="localhost"
        ) as pool:
            tasks.append(await generate_insight(pool, review_text, review_index))

    await asyncio.gather(*tasks)

    await connection.close()


asyncio.run(queue_coroutine())
