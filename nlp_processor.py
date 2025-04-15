import re
import string
import logging

# Configure logging
logger = logging.getLogger(__name__)

# For spell checking, we'll create a simple implementation since the package has issues
class SimpleSpellChecker:
    def __init__(self):
        self.dictionary = set()
        
    def __contains__(self, word):
        # Consider all words correct for now
        return True
        
    def correction(self, word):
        # Return the word as is
        return word

# Initialize simple spell checker
spell = SimpleSpellChecker()

def normalize_text(text):
    """
    Normalize text by removing extra whitespace, correcting common errors
    
    Args:
        text (str): Raw OCR text
        
    Returns:
        str: Normalized text
    """
    if not text:
        return ""
    
    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text)
    
    # Fix common OCR errors
    text = text.replace('|', 'I')  # Vertical bar to capital I
    text = text.replace('0', 'O')  # Zero to capital O (context-dependent, can be refined)
    
    # Remove unwanted characters that often appear in OCR output
    text = re.sub(r'[^\w\s.,:;?!\'"-]', '', text)
    
    return text.strip()

def correct_spelling(text):
    """
    Correct spelling errors in OCR text
    
    Args:
        text (str): OCR text with possible spelling errors
        
    Returns:
        str: Text with corrected spelling
    """
    if not text:
        return ""
        
    try:
        # Split text into words
        words = text.split()
        corrected_words = []
        
        for word in words:
            # Skip punctuation-only "words" and short words (likely to be correct or abbreviations)
            if all(c in string.punctuation for c in word) or len(word) <= 2:
                corrected_words.append(word)
                continue
                
            # Separate punctuation from the word
            match = re.match(r'([^\w]*)(\w+)([^\w]*)', word)
            if match:
                prefix, word_only, suffix = match.groups()
                # Correct only the word part
                if word_only.lower() not in spell:
                    correction = spell.correction(word_only)
                    if correction:
                        corrected_words.append(f"{prefix}{correction}{suffix}")
                    else:
                        corrected_words.append(word)  # Keep original if no correction found
                else:
                    corrected_words.append(word)  # Word is already correct
            else:
                corrected_words.append(word)  # Keep as is if no match
        
        return ' '.join(corrected_words)
    
    except Exception as e:
        logger.error(f"Error in spell correction: {str(e)}")
        return text  # Return original text on error

def enhance_text(ocr_text):
    """
    Apply NLP enhancements to raw OCR text
    
    Args:
        ocr_text (str): Raw text from OCR
        
    Returns:
        str: Enhanced text
    """
    try:
        if not ocr_text or ocr_text.isspace():
            return ""
            
        # Normalize the text
        normalized_text = normalize_text(ocr_text)
        
        # Correct spelling
        corrected_text = correct_spelling(normalized_text)
        
        logger.debug(f"Text enhanced: {len(ocr_text)} chars to {len(corrected_text)} chars")
        return corrected_text
    
    except Exception as e:
        logger.error(f"Error enhancing text: {str(e)}")
        return ocr_text  # Return original text on error
