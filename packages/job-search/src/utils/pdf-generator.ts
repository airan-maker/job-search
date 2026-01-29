import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { UserProfile, JobListing, GeneratedResume } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../../output');

async function ensureOutputDir(): Promise<void> {
  try {
    await fs.promises.access(OUTPUT_DIR);
  } catch {
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
  }
}

export async function generateResumePDF(
  profile: UserProfile,
  resume: GeneratedResume,
  job: JobListing
): Promise<string> {
  await ensureOutputDir();

  const fileName = `resume_${job.company.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `이력서 - ${profile.personalInfo.name}`,
        Author: profile.personalInfo.name
      }
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 헤더 - 이름 및 연락처
    doc.fontSize(24).text(profile.personalInfo.name, { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor('#666666');
    const contactInfo = [
      profile.personalInfo.email,
      profile.personalInfo.phone,
      profile.personalInfo.location
    ].filter(Boolean).join(' | ');
    doc.text(contactInfo, { align: 'center' });
    doc.moveDown(1);

    // 구분선
    doc.strokeColor('#cccccc').lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1);

    // 지원 포지션
    doc.fontSize(12).fillColor('#333333');
    doc.text(`지원 포지션: ${job.title} @ ${job.company}`, { align: 'center' });
    doc.moveDown(1);

    // 자기소개
    if (profile.summary) {
      doc.fontSize(14).fillColor('#000000').text('자기소개');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333333').text(profile.summary, {
        align: 'justify',
        lineGap: 3
      });
      doc.moveDown(1);
    }

    // 경력 사항
    if (profile.workExperience.length > 0) {
      doc.fontSize(14).fillColor('#000000').text('경력 사항');
      doc.moveDown(0.5);

      for (const exp of profile.workExperience) {
        doc.fontSize(11).fillColor('#000000')
          .text(`${exp.title}`, { continued: true })
          .fillColor('#666666')
          .text(` @ ${exp.company}`);

        const period = exp.current
          ? `${exp.startDate} - 현재`
          : `${exp.startDate} - ${exp.endDate}`;
        doc.fontSize(9).fillColor('#888888').text(period);
        doc.moveDown(0.3);

        doc.fontSize(10).fillColor('#333333').text(exp.description, {
          lineGap: 2
        });

        if (exp.achievements.length > 0) {
          doc.moveDown(0.3);
          for (const achievement of exp.achievements) {
            doc.fontSize(9).fillColor('#444444').text(`• ${achievement}`, {
              indent: 10
            });
          }
        }
        doc.moveDown(0.8);
      }
    }

    // 기술 스택
    if (profile.skills.length > 0) {
      doc.fontSize(14).fillColor('#000000').text('기술 스택');
      doc.moveDown(0.5);

      const skillNames = profile.skills.map(s => s.name).join(', ');
      doc.fontSize(10).fillColor('#333333').text(skillNames);
      doc.moveDown(1);
    }

    // 학력
    if (profile.education.length > 0) {
      doc.fontSize(14).fillColor('#000000').text('학력');
      doc.moveDown(0.5);

      for (const edu of profile.education) {
        doc.fontSize(10).fillColor('#000000')
          .text(`${edu.school} - ${edu.degree} ${edu.field}`);
        const period = edu.current
          ? `${edu.startDate} - 현재`
          : `${edu.startDate} - ${edu.endDate}`;
        doc.fontSize(9).fillColor('#888888').text(period);
        doc.moveDown(0.5);
      }
    }

    // 프로젝트
    if (profile.projects.length > 0) {
      doc.addPage();
      doc.fontSize(14).fillColor('#000000').text('프로젝트');
      doc.moveDown(0.5);

      for (const project of profile.projects) {
        doc.fontSize(11).fillColor('#000000').text(project.name);
        doc.fontSize(9).fillColor('#888888').text(`역할: ${project.role}`);
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#333333').text(project.description);

        if (project.technologies.length > 0) {
          doc.fontSize(9).fillColor('#666666')
            .text(`기술: ${project.technologies.join(', ')}`);
        }
        doc.moveDown(0.8);
      }
    }

    // 푸터
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#aaaaaa')
        .text(
          `Generated for ${job.company} | Page ${i + 1} of ${pages.count}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
    }

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

export async function generateCoverLetterPDF(
  profile: UserProfile,
  coverLetter: string,
  job: JobListing
): Promise<string> {
  await ensureOutputDir();

  const fileName = `cover_letter_${job.company.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 60,
      info: {
        Title: `자기소개서 - ${profile.personalInfo.name}`,
        Author: profile.personalInfo.name
      }
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 헤더
    doc.fontSize(18).text('자기소개서', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#666666')
      .text(`${job.title} @ ${job.company}`, { align: 'center' });
    doc.moveDown(1);

    // 지원자 정보
    doc.fontSize(10).fillColor('#333333');
    doc.text(`지원자: ${profile.personalInfo.name}`);
    doc.text(`연락처: ${profile.personalInfo.email}`);
    doc.text(`작성일: ${new Date().toLocaleDateString('ko-KR')}`);
    doc.moveDown(1);

    // 구분선
    doc.strokeColor('#cccccc').lineWidth(1)
      .moveTo(60, doc.y)
      .lineTo(535, doc.y)
      .stroke();
    doc.moveDown(1);

    // 자기소개서 본문
    doc.fontSize(11).fillColor('#000000');

    // 마크다운 간단 처리 (## 헤더, - 리스트)
    const lines = coverLetter.split('\n');
    for (const line of lines) {
      if (line.startsWith('## ')) {
        doc.moveDown(0.5);
        doc.fontSize(13).fillColor('#000000').text(line.replace('## ', ''));
        doc.moveDown(0.3);
        doc.fontSize(11);
      } else if (line.startsWith('### ')) {
        doc.moveDown(0.3);
        doc.fontSize(12).fillColor('#333333').text(line.replace('### ', ''));
        doc.moveDown(0.2);
        doc.fontSize(11);
      } else if (line.startsWith('- ')) {
        doc.fillColor('#333333').text(`• ${line.replace('- ', '')}`, { indent: 15 });
      } else if (line.trim()) {
        doc.fillColor('#333333').text(line, { lineGap: 3, align: 'justify' });
      } else {
        doc.moveDown(0.5);
      }
    }

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

export function getOutputDir(): string {
  return OUTPUT_DIR;
}
