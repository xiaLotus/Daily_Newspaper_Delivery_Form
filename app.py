from flask import Flask, request, jsonify
import json
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATA_FILE = r'static\data\data.json'

@app.route('/save', methods=['POST'])
def save_data():
    data = request.json
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    return jsonify({'message': '儲存成功'})

@app.route('/load', methods=['GET'])
def load_data():
    if not os.path.exists(DATA_FILE):
        return jsonify({'groups': []})
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
