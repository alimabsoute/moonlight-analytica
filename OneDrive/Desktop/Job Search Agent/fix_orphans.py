"""Apply 'Keep with next' to all company headers so they never orphan."""
import os
from docx import Document
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

DOCX = r"C:\Users\alima\OneDrive\Desktop\Job Search Agent\Ali Mabsoute_Resume_Q2_Master.docx"
PDF  = r"C:\Users\alima\OneDrive\Desktop\Job Search Agent\Ali Mabsoute_Resume_Q2_Master.pdf"

HEADERS = ["HYATT HOTELS", "MASCO CORP", "CITIGROUP",
           "COLLEGE AVE STUDENT LOANS", "OLD CITY LABS",
           "Galerie H", "AMERICAN EXPRESS"]

def set_keep_next(para):
    pPr = para._p.get_or_add_pPr()
    kn = pPr.find(qn('w:keepNext'))
    if kn is None:
        kn = OxmlElement('w:keepNext')
        pPr.append(kn)

doc = Document(DOCX)
count = 0
for p in doc.paragraphs:
    if any(p.text.startswith(h) for h in HEADERS):
        set_keep_next(p)
        count += 1
        # Also set on the first bullet right after (belt-and-suspenders: keep first bullet with header)
        # Actually keepNext on header alone is enough

print(f"[OK] keepNext set on {count} headers")
doc.save(DOCX)

# Export PDF + page count check
import win32com.client
word = win32com.client.Dispatch("Word.Application")
word.Visible = False
d = word.Documents.Open(os.path.abspath(DOCX))
d.SaveAs(os.path.abspath(PDF), FileFormat=17)
pages = d.ComputeStatistics(2)
d.Close()
word.Quit()
print(f"[OK] Pages: {pages}")
