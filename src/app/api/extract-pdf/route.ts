import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use pdf2json for text extraction
    const PDFParser = (await import('pdf2json')).default;
    
    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        // Extract text from all pages
        let fullText = '';
        if (pdfData.Pages) {
          for (const page of pdfData.Pages) {
            if (page.Texts) {
              for (const textItem of page.Texts) {
                if (textItem.R) {
                  for (const run of textItem.R) {
                    if (run.T) {
                      try {
                        fullText += decodeURIComponent(run.T) + ' ';
                      } catch {
                        // If decoding fails, use raw text
                        fullText += run.T.replace(/%[0-9A-Fa-f]*/g, ' ') + ' ';
                      }
                    }
                  }
                }
              }
            }
            fullText += '\n';
          }
        }
        resolve(fullText);
      });
      
      pdfParser.on('pdfParser_dataError', (error) => {
        reject(error);
      });
      
      pdfParser.parseBuffer(buffer);
    });
    
    // Parse the extracted text into resume sections
    const resumeContent = parseResumeText(text);
    
    return NextResponse.json({ 
      success: true, 
      text,
      resumeContent 
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract PDF content' }, { status: 500 });
  }
}

// Parse extracted text into resume sections
function parseResumeText(text: string): {
  education: { institution: string; details: string; degree: string }[];
  skills: string[];
  experience_note: string;
  leadership: { title: string; role: string }[];
} {
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  
  const result = {
    education: [] as { institution: string; details: string; degree: string }[],
    skills: [] as string[],
    experience_note: 'See full resume PDF for detailed experience.',
    leadership: [] as { title: string; role: string }[],
  };
  
  const sectionPatterns: Record<string, RegExp> = {
    education: /^(education|academic|academics)/i,
    skills: /^(skills|technical skills|technologies|proficiencies|competencies|tech stack)/i,
    leadership: /^(leadership|activities|organizations|involvement|extracurricular|clubs)/i,
  };
  
  let currentSection = '';
  let currentEducation: { institution: string; details: string; degree: string } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(line) && line.length < 40) {
        currentSection = section;
        continue;
      }
    }
    
    if (currentSection === 'education') {
      if (line.match(/university|college|institute|school of|academy/i) && line.length > 5) {
        if (currentEducation?.institution) {
          result.education.push(currentEducation);
        }
        currentEducation = { institution: line, details: '', degree: '' };
      } else if (currentEducation) {
        if (line.match(/bachelor|master|ph\.?d|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|associate|diploma/i)) {
          currentEducation.degree = line;
        } else if (line.match(/honors|college|program|major|minor|gpa|cum laude/i) && line.length < 100) {
          currentEducation.details = currentEducation.details ? `${currentEducation.details}, ${line}` : line;
        }
      }
    }
    
    if (currentSection === 'skills') {
      if (line.length < 100 && !line.match(/^(skills|technical|proficiencies)/i)) {
        const extractedSkills = line
          .split(/[,•|·\/]/)
          .map(s => s.trim())
          .filter(s => s.length > 1 && s.length < 40 && !s.match(/^\d+$/) && !s.match(/^(and|or|etc|including)$/i));
        result.skills.push(...extractedSkills);
      }
    }
    
    if (currentSection === 'leadership') {
      if (line.length > 3 && line.length < 100 && !line.match(/^[•\-\*\d]/)) {
        const roleMatch = line.match(/(president|vice president|treasurer|secretary|lead|director|organizer|volunteer|chair|member|founder|co-founder|captain|manager|coordinator|head|officer)/i);
        if (roleMatch) {
          const parts = line.split(/[-–—,]/);
          if (parts.length >= 2) {
            result.leadership.push({ title: parts[0].trim(), role: parts.slice(1).join(' ').trim() });
          } else {
            result.leadership.push({ title: line, role: roleMatch[0] });
          }
        }
      }
    }
  }
  
  if (currentEducation?.institution) {
    result.education.push(currentEducation);
  }
  
  result.skills = [...new Set(result.skills)].filter(s => s.length > 1).slice(0, 25);
  
  const seenLeadership = new Set<string>();
  result.leadership = result.leadership.filter(l => {
    const key = l.title.toLowerCase();
    if (seenLeadership.has(key)) return false;
    seenLeadership.add(key);
    return true;
  }).slice(0, 10);
  
  return result;
}
