import PyPDF2

def extract_text(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text

try:
    print("=== DEC 8 ===")
    print(extract_text('/Users/had1/Cognify/data/Dec. 8, 2025.pdf'))
    print("=== DEC 9 ===")
    print(extract_text('/Users/had1/Cognify/data/Dec. 9, 2025.pdf'))
except Exception as e:
    print("Error:", e)
