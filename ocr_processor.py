import cv2
import numpy as np
import pytesseract
import logging

# Configure logging
logger = logging.getLogger(__name__)

def preprocess_image(image_path):
    """
    Preprocess image to improve OCR accuracy
    
    Args:
        image_path (str): Path to the image file
        
    Returns:
        numpy.ndarray: Preprocessed image
    """
    try:
        # Read image
        img = cv2.imread(image_path)
        
        # Check if image was loaded successfully
        if img is None:
            logger.error(f"Failed to load image: {image_path}")
            raise ValueError(f"Failed to load image: {image_path}")
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply adaptive thresholding for better text detection
        thresh = cv2.adaptiveThreshold(
            blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 21, 15
        )
        
        # Noise removal - morphological operations
        kernel = np.ones((2, 2), np.uint8)
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # Dilate to connect text regions
        dilated = cv2.dilate(opening, kernel, iterations=1)
        
        logger.debug(f"Image preprocessing completed for {image_path}")
        return dilated
    
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise

def process_image(image_path):
    """
    Process image with OCR to extract text
    
    Args:
        image_path (str): Path to the image file
        
    Returns:
        str: Extracted text from the image
    """
    try:
        # Preprocess the image
        preprocessed_img = preprocess_image(image_path)
        
        # Configure tesseract parameters
        custom_config = r'--oem 3 --psm 6'
        
        # Extract text using Tesseract OCR
        text = pytesseract.image_to_string(preprocessed_img, config=custom_config)
        
        # Remove any non-printable characters
        text = ''.join(char for char in text if char.isprintable())
        
        logger.debug(f"OCR extracted {len(text)} characters")
        return text.strip()
    
    except Exception as e:
        logger.error(f"Error in OCR processing: {str(e)}")
        return f"OCR Error: {str(e)}"
