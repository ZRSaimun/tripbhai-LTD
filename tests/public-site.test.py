from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import unittest
ROOT = Path(__file__).resolve().parents[1] / 'public-pages'
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.links=[]; self.ids=[]; self.h1=0; self.images=[]; self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='h1':self.h1+=1
        if tag=='img':self.images.append(a)
        for key in ['href','src']:
            if key in a:self.links.append(a[key])
class PublicSite(unittest.TestCase):
    def test_pages_and_links(self):
        pages=list(ROOT.rglob('index.html')); self.assertEqual(len(pages),9)
        for file in pages:
            text=file.read_text(); p=Page(text)
            with self.subTest(page=str(file.relative_to(ROOT))):
                self.assertEqual(p.h1,1); self.assertEqual(len(p.ids),len(set(p.ids)))
                for fact in ['TRIP BHAI LTD','16286072','tripbhaiofficial@gmail.com','53 Blenheim Road']:self.assertIn(fact,text)
                for img in p.images:self.assertIn('alt',img)
                for href in p.links:
                    url=urlsplit(href)
                    if url.scheme or url.netloc:continue
                    path=(file.parent/unquote(url.path)).resolve() if url.path else file
                    if path.is_dir():path=path/'index.html'
                    self.assertTrue(path.exists(),f'{file}: broken {href}')
                    if url.fragment:self.assertIn(url.fragment,Page(path.read_text()).ids)
    def test_form_is_explicit(self):
        text=(ROOT/'contact/index.html').read_text()
        self.assertIn('nothing is submitted automatically',text)
        self.assertNotIn('type="file"',text)
        script=(ROOT/'site.js').read_text()
        self.assertNotIn('localStorage',script)
        self.assertIn('encodeURIComponent',script)
        self.assertIn("location.search",script)
if __name__=='__main__':unittest.main()
