import fitz # PyMuPDF
import os

pdf_paths = [
    '/Users/had1/Cognify/data/Dec. 8, 2025.pdf',
    '/Users/had1/Cognify/data/Dec. 9, 2025.pdf'
]

out_dir = '/Users/had1/Cognify/data/pages'
img_out_dir = '/Users/had1/Cognify/frontend/public/images/questions'

os.makedirs(out_dir, exist_ok=True)
os.makedirs(img_out_dir, exist_ok=True)

for pdf_path in pdf_paths:
    doc_name = os.path.basename(pdf_path).split('.')[0]
    doc = fitz.open(pdf_path)
    
    # Render pages to view math formulas
    for i in range(len(doc)):
        page = doc[i]
        pix = page.get_pixmap(dpi=150)
        pix.save(f"{out_dir}/{doc_name}_page_{i}.png")
        
    # Extract embedded images
    for i in range(len(doc)):
        start = 0
        img_list = doc.get_page_images(i)
        for img in img_list:
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            ext = base_image["ext"]
            img_path = f"{img_out_dir}/{doc_name}_p{i}_{start}.{ext}"
            with open(img_path, "wb") as f:
                f.write(image_bytes)
            start += 1
