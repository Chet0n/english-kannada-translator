from flask import Flask, render_template, request, jsonify
from translations import TRANSLATIONS

app = Flask(__name__)

@app.get("/")
def home():
    # Provide a few examples to display on the page.
    examples = ["hello", "thank you", "good morning", "how are you", "water", "I love you"]
    return render_template("index.html", examples=examples)

@app.post("/translate")
def translate():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")

    if not isinstance(text, str):
        return jsonify({"error": "Please enter a valid word or phrase."}), 400

    english = " ".join(text.strip().lower().split())
    if not english:
        return jsonify({"error": "Enter an English word or phrase first."}), 400

    kannada = TRANSLATIONS.get(english)
    if kannada is None:
        return jsonify({
            "found": False,
            "english": text.strip(),
            "message": "Sorry, this phrase is not in the dictionary yet."
        })

    return jsonify({
        "found": True,
        "english": text.strip(),
        "kannada": kannada
    })

if __name__ == "__main__":
    app.run(debug=True)
