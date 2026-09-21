"""Regenerate the printable questions and instructor key from the live worksheet."""
from pathlib import Path
import re
import html

ROOT = Path(__file__).resolve().parent
source = (ROOT / 'index.html').read_text()
forms = re.findall(r'<form class="check".*?</form>', source, re.S)

def text(markup):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', markup))).strip()

pages = []
answers = []
section_names = ['Order is information', 'Inputs and targets', 'A running state', 'Unroll the RNN', 'Distant dependencies']
for i in range(5):
    questions = []
    for form in forms[i*3:i*3+3]:
        number = re.search(r'<span class="qnum">(.*?)</span>', form, re.S).group(1)
        prompt = re.search(r'<h3>(.*?)</h3>', form, re.S).group(1)
        answer = re.search(r'<details class="answer">.*?<div>(.*?)</div></details>', form, re.S).group(1)
        choices = re.findall(r'<label><input type="radio"[^>]+>(.*?)</label>', form, re.S)
        options = '<p class="choices">' + ' &nbsp; · &nbsp; '.join('□ '+x for x in choices) + '</p>' if choices else '<p class="blank">Answer: __________________________</p>'
        questions.append(f'<article><small>{number}</small><h3>{prompt}</h3>{options}<p class="writing">My reasoning:</p><div class="rule"></div><div class="rule"></div></article>')
        answers.append(f'### {text(number)}\n\n{text(prompt)}\n\n{text(answer)}\n')
    reference = [
        'The three 3×3 image frames have centre rows [1,0,0], [0,1,0], [0,0,1]. All other pixels are 0. Time runs in the stated frame order.',
        'One-hot vocabulary: [not, very, good]. Sequence classification predicts a final label; token tagging aligns labels; next-token prediction shifts targets one step ahead.',
        'Linear toy: hₜ = xₜ + 0.5hₜ₋₁, h₀ = 0. Tanh RNN: hₜ = tanh(Wₓxₜ + Wₕhₜ₋₁ + bₕ). States and weights are different objects.',
        'One recurrent layer + output head: P = Hd + H² + H + CH + C. Count each shared weight and bias once; the initial state is fixed.',
        'Across a recurrent path, local derivatives multiply. For a scalar linear chain the sensitivity is wᴸ. For tanh each local derivative is w(1 − hₜ²).',
    ][i]
    pages.append(f'<section class="page"><div class="eyebrow">SEQUENCE MODELLING / STUDENT PRACTICE</div><h2>{i+1:02d} · {section_names[i]}</h2><p class="reference">{reference}</p>'+''.join(questions)+'</section>')
exit_page='''<section class="page"><div class="eyebrow">SEQUENCE MODELLING / EXIT TICKET</div><h2>Design. Diagnose. Remember.</h2><p>A sensor sends one measurement per minute. At the end of a variable-length stream, report whether an early warning happened before a later fault. Reversing those events should change the answer.</p><h3>1. Specify the input, target, output timing and what the hidden state must retain. Why may the mean reading be insufficient?</h3><div class="space"></div><h3>2. If performance worsens as the gap grows, name two hypotheses and one experiment to distinguish them.</h3><div class="space"></div><h3>3. What word began the lecture? How is your memory challenge similar to—and different from—the toy RNN?</h3><div class="space"></div><p class="footer">Self-check after discussion: I can explain order □ · state versus weights □ · unrolling □ · long gradient paths □</p></section>'''
styles='''*{box-sizing:border-box}body{margin:0;background:#f6f4ed;color:#183c35;font:15px/1.7 system-ui,sans-serif}header,main{max-width:850px;margin:auto}header{padding:32px 35px 0}header p{font-size:14px}a{color:#12655b}.page{margin:30px 0;background:#fffefa;border:1px solid #cbd7ca;padding:32px 40px;border-radius:12px}.eyebrow,small{font:11px ui-monospace,monospace;letter-spacing:.07em;color:#12655b}h1{font:42px/1.1 Georgia,serif}h2{font-size:26px;font-weight:550;margin:12px 0 18px}h3{font-size:15px;line-height:1.7;font-weight:550;margin:10px 0}.reference{border-left:3px solid #9caf95;background:#edf1e5;padding:13px 16px;font-size:13px}article{margin-top:25px;padding-top:15px;border-top:1px solid #d6dfd0}.choices,.blank{font-size:14px}.writing{font-size:12px;margin:18px 0 0}.rule{height:23px;border-bottom:1px solid #d5dacf}.space{height:135px;background:repeating-linear-gradient(white,white 26px,#d5dacf 27px,white 28px)}.footer{font-size:12px;color:#586c62}.name{margin:25px 0}@media print{@page{size:A4;margin:16mm}body{background:white;font-size:10pt}header{padding:0}header h1{font-size:25pt}header .links{display:none}.page{border:0;border-radius:0;margin:0;padding:10px 0;break-after:page}.page:last-child{break-after:auto}header+.page{break-before:auto}h2{font-size:19pt}h3{font-size:10.5pt}article{break-inside:avoid;margin-top:18px}.reference{font-size:9pt}small,.eyebrow{font-size:8pt}.rule{height:20px}.space{height:115px}header{break-after:avoid}}@media(max-width:600px){.page{padding:23px 20px;margin:18px 10px}header{padding:24px 20px 0}}'''
page='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sequence modelling · Printable student handout</title><style>'+styles+'</style></head><body><header><p class="links"><a href="index.html">← Interactive worksheet</a> · <a href="instructor-guide.md">Instructor answer key</a></p><h1>Remember what came before.</h1><p>Predict first. Show your reasoning. Use the lecture experiments to revise your explanation.</p><p class="name">Name: _______________________ &nbsp; Date: ______________</p></header><main>'+''.join(pages)+exit_page+'</main></body></html>'
(ROOT/'student-handout.html').write_text(page)
guide=ROOT/'instructor-guide.md'
base=guide.read_text().split('<!-- GENERATED ANSWERS -->')[0].rstrip()
guide.write_text(base+'\n\n<!-- GENERATED ANSWERS -->\n\n'+'\n'.join(answers))
print(f'Generated printable handout and {len(answers)} worked answers.')
