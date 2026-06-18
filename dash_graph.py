from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/chart-data")
def chart_data():
    data = {
        "labels": ["Netflix", "Amazon", "Apple Music"],
        "values": [15.99, 10.09, 16.00]
    }
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)