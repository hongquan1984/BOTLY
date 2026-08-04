import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Accordion } from "@/components/ui/Accordion";
import { faqs } from "@/data/faq";

export function Faq() {
  return (
    <Section id="faq">
      <SectionHeading
        eyebrow="FAQ"
        title="Câu hỏi thường gặp"
        description="Những thắc mắc phổ biến trước khi bắt đầu hành trình AI Automation."
      />
      <div className="mx-auto mt-10 max-w-3xl">
        <Accordion items={[...faqs]} />
      </div>
    </Section>
  );
}
