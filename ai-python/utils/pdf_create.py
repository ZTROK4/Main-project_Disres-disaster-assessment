from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import textwrap

def generate_pdf(text, file_path="disaster_report.pdf"):
    c = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4

    y = height - 40
    for line in textwrap.wrap(text, 95):
        if y < 40:
            c.showPage()
            y = height - 40
        c.drawString(40, y, line)
        y -= 14

    c.save()
    return file_path
