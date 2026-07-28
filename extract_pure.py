import sys
import subprocess

def install_pypdf():
    try:
        import pypdf
        return pypdf
    except ImportError:
        print("Installing pypdf...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pypdf"], check=True)
        import pypdf
        return pypdf

def extract_pdf():
    pypdf = install_pypdf()
    reader = pypdf.PdfReader("gstudio/luxus.pdf")
    pages_text = []
    
    for idx, page in enumerate(reader.pages):
        text = page.extract_text()
        pages_text.append(f"=== PAGE {idx+1} ===")
        pages_text.append(text)
        
    with open("luxus_pdf_pypdf.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(pages_text))
        
    print(f"Extracted {len(reader.pages)} pages to luxus_pdf_pypdf.txt")

if __name__ == "__main__":
    extract_pdf()
