import os
import logging
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import uuid
import tempfile
from ocr_processor import process_image
from nlp_processor import enhance_text

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "fallback_secret_key")

# Configure upload settings
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
TEMP_FOLDER = tempfile.gettempdir()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/process-image', methods=['POST'])
def process_handwriting():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image part in the request'}), 400
            
        image_file = request.files['image']
        
        if image_file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
            
        if not allowed_file(image_file.filename):
            return jsonify({'error': 'Invalid file type. Allowed types: png, jpg, jpeg, gif, bmp, tiff'}), 400
        
        # Create a unique filename
        filename = secure_filename(image_file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(TEMP_FOLDER, unique_filename)
        
        # Save the file temporarily
        image_file.save(file_path)
        logger.debug(f"Saved image to {file_path}")
        
        # Process image with OCR
        ocr_text = process_image(file_path)
        logger.debug(f"OCR result: {ocr_text}")
        
        # Apply NLP enhancements
        enhanced_text = enhance_text(ocr_text)
        logger.debug(f"Enhanced text: {enhanced_text}")
        
        # Remove temporary file
        os.remove(file_path)
        
        return jsonify({
            'original_text': ocr_text,
            'enhanced_text': enhanced_text
        })
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large'}), 413

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
