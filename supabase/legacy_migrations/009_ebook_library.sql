begin;

create table public.ebook_categories (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text not null,
  name_vi text not null,
  slug text not null unique,
  sort_order integer not null default 0
);

create table public.wellness_ebooks (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  public_display_title text not null,
  public_subtitle text not null default '',
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary_short text not null default '',
  summary_long text not null default '',
  cover_image_url text,
  category_id text references public.ebook_categories(id),
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  language text not null default 'en',
  downloadable_file_url text,
  sample_file_url text,
  source_title_original text,
  source_author text,
  source_url text,
  source_site text,
  document_delivery_note text not null default '',
  source_license_type text not null default 'unverified',
  redistribution_allowed boolean not null default false,
  attribution_required boolean not null default true,
  legal_notes_internal text not null default '',
  featured boolean not null default false,
  seo_title text,
  seo_description text,
  premium_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (downloadable_file_url is null or redistribution_allowed)
);

create table public.ebook_email_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null check (length(email) <= 254),
  name text,
  ebook_id text not null references public.wellness_ebooks(id),
  locale text not null default 'en' check (locale in ('en','vi')),
  source_page text not null default '',
  delivery_consent_at timestamptz not null default now(),
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (email, ebook_id)
);

create table public.ebook_download_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.ebook_email_leads(id),
  ebook_id text not null references public.wellness_ebooks(id),
  source_page text not null default '',
  event text not null check (event in ('unlocked','downloaded','view_source')),
  created_at timestamptz not null default now()
);
create table public.ebook_page_views (
  id uuid primary key default gen_random_uuid(),
  ebook_id text not null references public.wellness_ebooks(id),
  source_page text not null default '',
  created_at timestamptz not null default now()
);
create table public.ebook_article_links (
  article_id uuid not null references public.wellness_articles(id) on delete cascade,
  ebook_id text not null references public.wellness_ebooks(id),
  relevance text not null default 'related',
  created_at timestamptz not null default now(),
  primary key (article_id, ebook_id)
);
create table public.content_generation_logs (
  id uuid primary key default gen_random_uuid(),
  task_type text not null,
  status text not null check (status in ('queued','draft','published','failed','paused')),
  internal_note_vi text not null default '',
  source_ebook_id text references public.wellness_ebooks(id),
  article_id uuid references public.wellness_articles(id),
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.legal_review_logs (
  id uuid primary key default gen_random_uuid(),
  ebook_id text not null references public.wellness_ebooks(id),
  reviewer text,
  decision text not null check (decision in ('host','link_out','exclude','pending')),
  jurisdiction text not null default 'global',
  evidence_url text,
  note_vi text not null default '',
  reviewed_at timestamptz not null default now()
);
create table public.ebook_download_rate_limits (
  bucket_hash text primary key,
  window_start timestamptz not null,
  attempts integer not null
);

create function public.set_ebook_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
 new.updated_at = now();
 return new;
end; $$;
create trigger wellness_ebooks_updated_at before update on public.wellness_ebooks
 for each row execute function public.set_ebook_updated_at();
create table public.content_generation_queue (
  id uuid primary key default gen_random_uuid(),
  scheduled_for timestamptz not null unique,
  source_ebook_id text references public.wellness_ebooks(id),
  topic_angle text not null,
  status text not null default 'queued' check (status in ('queued','draft','review','published','failed','paused')),
  article_id uuid references public.wellness_articles(id),
  attempts smallint not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.ebook_categories (id,name_en,name_vi,slug,sort_order) values
 ('herbal-drinks','Herbal Drinks','Đồ uống thảo mộc','herbal-drinks',1),
 ('natural-remedies','Traditional Wellness','Chăm sóc truyền thống','traditional-wellness',2),
 ('healthy-recipes','Healthy Recipes','Công thức lành mạnh','healthy-recipes',3),
 ('digestive-support','Digestive Support','Hỗ trợ tiêu hóa','digestive-support',4),
 ('sleep-support','Sleep Support','Hỗ trợ giấc ngủ','sleep-support',5)
on conflict (id) do nothing;

insert into public.ebook_categories (id,name_en,name_vi,slug,sort_order) values
 ('food-wellness','Food & Wellness','Thực phẩm & Sức khỏe','food-wellness',6),
 ('healthy-drinks','Healthy Drinks','Đồ uống lành mạnh','healthy-drinks',7),
 ('wellness-history','Wellness History','Lịch sử chăm sóc sức khỏe','wellness-history',8),
 ('herbal-traditions','Herbal Traditions','Truyền thống thảo mộc','herbal-traditions',9),
 ('botanical-reference','Botanical Reference','Tài liệu thực vật','botanical-reference',10),
 ('heritage-cooking','Heritage Cooking','Ẩm thực di sản','heritage-cooking',11),
 ('herbal-reference','Herbal Reference','Tài liệu thảo mộc','herbal-reference',12),
 ('nutrition','Nutrition','Dinh dưỡng','nutrition',13),
 ('herbal-tea','Herbal Tea','Trà thảo mộc','herbal-tea',14),
 ('tea-preparation','Tea Preparation','Pha trà','tea-preparation',15),
 ('resource-collection','Resource Collection','Tuyển tập tài nguyên','resource-collection',16)
on conflict (id) do nothing;

-- Existing Botly PDFs are Botly-produced guides. The external titles below are
-- retained only for legal/admin tracking; uncertain works remain link-out only.
insert into public.wellness_ebooks
 (id,public_display_title,public_subtitle,slug,summary_short,summary_long,cover_image_url,category_id,tags,status,language,downloadable_file_url,source_title_original,source_author,source_url,source_site,source_license_type,redistribution_allowed,attribution_required,legal_notes_internal,featured,seo_title,seo_description)
values
 ('blood-sugar','Everyday Food Pairings for Steadier Meals','A practical guide to fibre, grains and balanced plates.','everyday-food-pairings','Explore familiar combinations and the nutrition research behind them.','A Botly-created educational handbook about everyday meal combinations and nutrition evidence.','/ebooks/blood-sugar/lentils-rice-hero.png','healthy-recipes',array['nutrition','food pairings'],'published','en','/ebooks/blood-sugar/healthclues-blood-sugar-guide.pdf',null,null,null,'Botly','Botly original',true,false,'Nội dung do Botly biên soạn; rà soát tuyên bố sức khỏe trước mỗi lần cập nhật.',true,'Everyday Food Pairings | Botly Wellness Library','A practical, evidence-aware guide to fibre, grains and balanced meals.'),
 ('antioxidants','Colorful Foods & Everyday Pairings','A clear guide to plant foods, preparation and nutrition context.','colorful-food-pairings','Learn about colorful ingredients and the research context around them.','A Botly-created educational handbook. It does not diagnose, treat or prevent disease.','/ebooks/antioxidants/tomato-olive-oil-hero.png','healthy-recipes',array['plant foods','nutrition'],'published','en','/ebooks/antioxidants/healthclues-antioxidant-guide.pdf',null,null,null,'Botly','Botly original',true,false,'Nội dung do Botly biên soạn; rà soát tuyên bố sức khỏe trước mỗi lần cập nhật.',true,'Colorful Foods & Everyday Pairings | Botly','A practical guide to plant foods, preparation and nutrition context.'),
 ('weight-management','Building Satisfying Everyday Meals','Simple meal ideas focused on variety, fibre and satisfaction.','satisfying-everyday-meals','Explore meal building blocks for everyday eating.','A Botly-created guide to meal composition and food variety.','/ebooks/covers/vol3-weight-management.png','healthy-recipes',array['everyday meals','nutrition'],'published','en',null,null,null,null,'Botly','Botly original',true,false,'Chưa có tệp PDF tại vị trí cũ; chỉ bật tải sau khi tệp được xác nhận và triển khai.',false,'Building Satisfying Everyday Meals | Botly','A practical guide to varied, satisfying meals.'),
 ('better-sleep','Gentle Evening Food & Drink Ideas','Comforting options for an unhurried evening routine.','gentle-evening-food-drink','Explore warm drinks and evening food ideas.','A Botly-created lifestyle guide. Food and drink are not a treatment for sleep disorders.','/ebooks/covers/vol4-better-sleep.jpg','sleep-support',array['evening routine','drinks'],'published','en',null,null,null,null,'Botly','Botly original',true,false,'Chưa có tệp PDF tại vị trí cũ; chỉ bật tải sau khi tệp được xác nhận và triển khai.',false,'Gentle Evening Food & Drink Ideas | Botly','Comforting food and drink ideas for an evening routine.'),
 ('gout-support','Food & Everyday Wellness: An Evidence Guide','Understand the limits and context of nutrition research.','food-everyday-wellness-evidence','An educational overview of food, hydration and research context.','A Botly-created educational handbook. It is not a substitute for clinical care.','/ebooks/covers/vol5-gout-support.png','natural-remedies',array['nutrition evidence','wellness'],'published','en',null,null,null,null,'Botly','Botly original',true,false,'Chưa có tệp PDF tại vị trí cũ; chỉ bật tải sau khi tệp được xác nhận và triển khai.',false,'Food & Everyday Wellness | Botly','An educational overview of food, hydration and nutrition research.'),
 ('liver-health','Everyday Foods & Liver Health: A Clear Guide','Separate familiar food choices from detox marketing claims.','everyday-foods-liver-health','A careful introduction to food choices and liver health claims.','A Botly-created educational guide. It does not claim to detox or treat liver disease.','/ebooks/covers/vol6-liver-health.png','natural-remedies',array['food literacy','wellness'],'published','en','/ebooks/liver-health/healthclues-liver-health-guide.pdf',null,null,null,'Botly','Botly original',true,false,'Nội dung do Botly biên soạn; tránh tuyên bố chữa bệnh/thải độc.',false,'Everyday Foods & Liver Health | Botly','A careful guide to everyday foods and liver health claims.'),
 ('food-remedies','Food Traditions & Everyday Ingredients','Explore a historical food text with modern context.','food-traditions-ingredients','A historical reference for curious readers.','Link to the original source. Historical remedy claims are not current medical advice.','/ebooks/covers/vol3-weight-management.png','natural-remedies',array['history','food traditions'],'published','en',null,'Food Remedies: Facts About Foods and Their Medicinal Uses','Florence Daniel','https://www.gutenberg.org/ebooks/18487','Project Gutenberg','Project Gutenberg US public domain; jurisdiction review pending',false,true,'Gutenberg identifies this as US public domain; outside-US laws need review. The historic medical claims are unsafe to repeat as advice.',false,'Food Traditions & Everyday Ingredients | Botly','Explore a historical food text through its original source.'),
 ('healthy-life-beverage-book','A Guide to Historic Everyday Beverages','Browse a historical beverage text at its original source.','historic-everyday-beverages','A historical resource for readers interested in food culture.','Historical material is presented for cultural interest and is not health advice.','/ebooks/antioxidants/green-tea-citrus-hero.png','herbal-drinks',array['history','beverages'],'published','en',null,'The Healthy Life Beverage Book','H. Valentine Knaggs','https://www.gutenberg.org/ebooks/78781','Project Gutenberg','Project Gutenberg US public domain; jurisdiction review pending',false,true,'Link out pending distribution territory review.',false,'A Guide to Historic Everyday Beverages | Botly','Browse a historic beverage resource at its original source.'),
 ('mothers-remedies','A Historical Guide to Home Traditions','Read a historical source with clear modern safety context.','historical-home-traditions','A period reference preserved for historical interest.','Historical remedies can be unsafe and are not medical advice. Consult qualified professionals for health concerns.','/ebooks/covers/vol4-better-sleep.jpg','natural-remedies',array['history','safety'],'published','en',null,'Mother’s Remedies','Thomas Jefferson Ritter','https://www.gutenberg.org/ebooks/17439','Project Gutenberg','Project Gutenberg US public domain; jurisdiction review pending',false,true,'Historical medical content can be unsafe; link out only and include a safety disclaimer.',false,'A Historical Guide to Home Traditions | Botly','Read a historical home reference at its original source.'),
 ('a-book-of-simples','A Botanical History Reading List','Explore traditional plant knowledge as cultural history.','botanical-history-reading-list','A historical botanical reference for curious readers.','A historical collection of household recipes and plant traditions.','/ebooks/covers/vol5-gout-support.png','natural-remedies',array['botanical history'],'published','en',null,'A Book of Simples','Henry William Lewer','https://www.gutenberg.org/ebooks/53951','Project Gutenberg','Project Gutenberg US public domain; jurisdiction review pending',false,true,'Gutenberg identifies this as public domain in the USA; outside-US laws require review. Historical remedy instructions are unsafe and not medical advice.',false,'A Botanical History Reading List | Botly','Explore an early household and botanical collection at its original source.'),
 ('complete-herbal','A Historical Herbal Reader','Explore an early herbal text as history, not medical advice.','historical-herbal-reader','A historical herbal reference with a modern safety note.','Historical recommendations are not current medical advice. Link to the original provider.','/ebooks/covers/vol6-liver-health.png','natural-remedies',array['history','botany'],'published','en',null,'The Complete Herbal','Nicholas Culpeper','https://www.gutenberg.org/ebooks/49513','Project Gutenberg','Project Gutenberg US public domain; jurisdiction review pending',false,true,'Gutenberg cautions users outside the US to check local law; link out pending review.',false,'A Historical Herbal Reader | Botly','Explore an early herbal text as cultural history.'),
 ('hildas-recipes','Cape, Indian & Malay Recipe Heritage','Discover a historic collection through the library source.','cape-recipe-heritage','A cultural food-history resource hosted by its library.','This work is marked In copyright by Wellcome Collection. Botly links to the catalog and does not host the scan.','/ebooks/covers/vol3-weight-management.png','healthy-recipes',array['food history','recipes'],'published','en',null,'Hilda’s “Where is it?” of Recipes','Hildagonda J. Duckitt','https://wellcomecollection.org/works/t5cqdg7g','Wellcome Collection','In copyright',false,true,'Wellcome record says In copyright; external source link only.',false,'Cape Recipe Heritage | Botly','Explore a historic recipe collection at Wellcome Collection.'),
 ('herbal-simples','A Historical Guide to Herbal Traditions','Read a public-domain botanical work with modern context.','historical-herbal-traditions','A historical plant reference preserved by Wellcome Collection.','Wellcome Collection marks this work Public Domain Mark. Botly links out pending jurisdiction-specific review.','/ebooks/covers/vol6-liver-health.png','natural-remedies',array['botanical history','herbs'],'published','en',null,'Herbal Simples: Approved for Modern Uses of Cure','W. T. Fernie','https://wellcomecollection.org/works/yyu6fnvg','Wellcome Collection','Public Domain Mark; jurisdiction review pending',false,true,'Wellcome applies Public Domain Mark. Link out until distribution territory is reviewed; historical health claims require safety context.',false,'A Historical Guide to Herbal Traditions | Botly','Browse a historical botanical resource at Wellcome Collection.'),
 ('culinary-medicine-2025','Modern Culinary Medicine: Source Edition','Open the publisher’s current edition and course materials.','modern-culinary-medicine','A contemporary educational resource available from its publisher.','Source page and terms require review before hosting or redistribution.','/ebooks/antioxidants/avocado-tomato-hero.png','healthy-recipes',array['culinary medicine'],'draft','en',null,'Culinary Medicine – 2025 Edition',null,null,'Open Textbook','terms unverified',false,true,'Chưa xác minh URL/điều khoản xuất bản; giữ bản nháp.',false,null,null),
 ('herbal-tea-recipes-remedies','A Collection of Herbal Tea Ideas','A source listing for readers exploring herbal tea traditions.','herbal-tea-ideas','Source identity and reuse terms need verification.','No source file is hosted until publisher terms and URL are verified.','/ebooks/antioxidants/green-tea-citrus-hero.png','herbal-drinks',array['herbal tea'],'draft','en',null,'Herbal Tea Recipes & Remedies',null,null,'Free-Ebooks','terms unverified',false,true,'Chưa xác minh quyền phân phối hoặc URL nguồn; giữ bản nháp.',false,null,null),
 ('preparing-herbal-teas','A Practical Introduction to Herbal Infusions','Explore an educational resource at the original publisher.','herbal-infusion-introduction','The original source needs a rights and URL review.','No source file is hosted until reuse terms are verified.','/ebooks/antioxidants/green-tea-citrus-hero.png','herbal-drinks',array['herbal tea','infusions'],'draft','en',null,'Preparing Herbal Teas',null,null,'ACHS','terms unverified',false,true,'Chưa xác minh quyền phân phối hoặc URL nguồn; giữ bản nháp.',false,null,null),
 ('grass-roots-remedies','Community Herbal Learning Resources','Review community materials at their original publisher.','community-herbal-learning','Source collection needs individual rights and safety review.','No files are hosted from this collection pending item-level rights review.','/ebooks/covers/vol6-liver-health.png','natural-remedies',array['herbal learning'],'draft','en',null,'Grass Roots Remedies resources',null,null,'Grass Roots Remedies','terms unverified',false,true,'Cần rà soát từng tài liệu về giấy phép, quyền ảnh và an toàn sức khỏe.',false,null,null)
on conflict (id) do update set public_display_title=excluded.public_display_title, public_subtitle=excluded.public_subtitle, source_title_original=excluded.source_title_original, source_author=excluded.source_author, source_url=excluded.source_url, source_site=excluded.source_site, source_license_type=excluded.source_license_type, redistribution_allowed=excluded.redistribution_allowed, attribution_required=excluded.attribution_required, legal_notes_internal=excluded.legal_notes_internal;

-- Import the supplied Botly catalog: its display title is the only title used
-- on cards. External files remain link-out until the listed terms are cleared.
update public.wellness_ebooks set public_display_title='Everyday Food & Wellness',public_subtitle='Food traditions for everyday living',slug='everyday-food-wellness',summary_short='Explore food traditions and everyday ingredients through a historical source.',summary_long='This Botly catalog cover is not a Botly-authored ebook. The actual source document is “Food Remedies: Facts About Foods and Their Medicinal Uses.” It is hosted by Project Gutenberg; use its page to read or download a source-provided format. Botly does not host this file.',cover_image_url='/ebooks/library/botly-ebook-01-everyday-food-wellness.webp',category_id='food-wellness',tags=array['food history','nutrition','historical source'],status='published',downloadable_file_url=null,source_title_original='Food Remedies: Facts About Foods and Their Medicinal Uses',source_author='Florence Daniel',source_url='https://www.gutenberg.org/ebooks/18487',source_site='Project Gutenberg',document_delivery_note='The reader receives the original Project Gutenberg ebook from its source page, not a Botly PDF.',source_license_type='Public domain in the United States; Project Gutenberg terms and local jurisdiction review required',redistribution_allowed=false,attribution_required=true,legal_notes_internal='Link-out pending territory-specific rights review. Historical medical claims must not be presented as current advice.' where id='food-remedies';
update public.wellness_ebooks set public_display_title='Botanical Drink Recipes',public_subtitle='Refreshing blends and comforting drinks',slug='botanical-drink-recipes',summary_short='Browse historic beverage ideas and food culture.',summary_long='This Botly catalog cover is not a Botly-authored ebook. The actual source document is “The Healthy Life Beverage Book.” Project Gutenberg hosts the source; use its page to read or download an available source format. Botly does not host this file.',cover_image_url='/ebooks/library/botly-ebook-02-botanical-drink-recipes.webp',category_id='healthy-drinks',tags=array['beverages','food history'],status='published',downloadable_file_url=null,source_title_original='The Healthy Life Beverage Book',source_author=null,source_url='https://www.gutenberg.org/ebooks/78781',source_site='Project Gutenberg',document_delivery_note='The actual document is the historical Project Gutenberg ebook; formats are provided at the source page.',source_license_type='Public domain in the United States; Project Gutenberg terms and local jurisdiction review required',redistribution_allowed=false,attribution_required=true,legal_notes_internal='Link-out pending territory-specific rights review. Historical claims need editorial context.' where id='healthy-life-beverage-book';
update public.wellness_ebooks set public_display_title='The Home Wellness Almanac',public_subtitle='A historical collection of household traditions',slug='home-wellness-almanac',summary_short='A historical home reference, presented for cultural interest.',summary_long='This Botly catalog cover is not a Botly-authored ebook. The actual source document is “Mother’s Remedies,” a historical home-remedy book. Project Gutenberg hosts the source ebook; use its page to read or download an available format. Botly does not host this file.',cover_image_url='/ebooks/library/botly-ebook-03-home-wellness-almanac.webp',category_id='wellness-history',tags=array['history','household traditions'],status='published',downloadable_file_url=null,source_title_original='Mother’s Remedies',source_author='Thomas Jefferson Ritter',source_url='https://www.gutenberg.org/ebooks/17439',source_site='Project Gutenberg',document_delivery_note='The actual document is the source’s historical ebook. Botly does not host or modify the source file.',source_license_type='Public domain in the United States; Project Gutenberg terms and local jurisdiction review required',redistribution_allowed=false,attribution_required=true,legal_notes_internal='Historical medical instructions may be unsafe; link out and show a clear historical-use disclaimer.' where id='mothers-remedies';
update public.wellness_ebooks set public_display_title='Heritage Herbal Preparations',public_subtitle='Plants and preparations from the past',slug='heritage-herbal-preparations',summary_short='Read a historic collection of household recipes and plant traditions.',summary_long='This Botly catalog cover is not a Botly-authored ebook. The actual source document is “A Book of Simples,” edited by Henry William Lewer. It is hosted by Project Gutenberg; formats are available from the source page. Botly does not host this file.',cover_image_url='/ebooks/library/botly-ebook-04-heritage-herbal-preparations.webp',category_id='herbal-traditions',tags=array['botanical history','heritage recipes'],status='published',downloadable_file_url=null,source_title_original='A Book of Simples',source_author='Henry William Lewer (editor)',source_url='https://www.gutenberg.org/ebooks/53951',source_site='Project Gutenberg',document_delivery_note='The actual document is the original Project Gutenberg ebook, delivered from its source page.',source_license_type='Public domain in the United States; Project Gutenberg terms and local jurisdiction review required',redistribution_allowed=false,attribution_required=true,legal_notes_internal='Historical remedy material is not current medical advice. Link out pending territory-specific rights review.' where id='a-book-of-simples';
update public.wellness_ebooks set public_display_title='The Botanical Reference Guide',public_subtitle='An introduction to historic herbal knowledge',slug='botanical-reference-guide',summary_short='Explore a historic botanical reference as cultural history.',summary_long='This Botly catalog cover is not a Botly-authored ebook. The actual source document is “The Complete Herbal” by Nicholas Culpeper. Project Gutenberg provides the source ebook and available formats. Botly does not host this file.',cover_image_url='/ebooks/library/botly-ebook-05-botanical-reference-guide.webp',category_id='botanical-reference',tags=array['botany','historical source'],status='published',downloadable_file_url=null,source_title_original='The Complete Herbal',source_author='Nicholas Culpeper',source_url='https://www.gutenberg.org/ebooks/49513',source_site='Project Gutenberg',document_delivery_note='The actual file is the source’s historic herbal ebook, linked on Project Gutenberg.',source_license_type='Public domain in the United States; Project Gutenberg terms and local jurisdiction review required',redistribution_allowed=false,attribution_required=true,legal_notes_internal='Contains historic medicinal advice; display safety notice. Link out pending territory-specific rights review.' where id='complete-herbal';
update public.wellness_ebooks set public_display_title='Vintage Home Kitchen Recipes',public_subtitle='Classic flavors and heritage recipes',slug='vintage-home-kitchen-recipes',summary_short='Browse a digitized historical cookbook from a library collection.',summary_long='This Botly catalog cover is not a Botly-authored ebook. The actual source is Wellcome Collection’s digitized book record, which provides access to the scanned historical volume (including a whole-item PDF where available). Botly does not host the scan.',cover_image_url='/ebooks/library/botly-ebook-06-vintage-home-kitchen-recipes.webp',category_id='heritage-cooking',tags=array['heritage cooking','food history'],status='published',downloadable_file_url=null,source_title_original='Hilda’s “Where Is It?” of Recipes',source_author='Hildagonda J. Duckitt',source_url='https://wellcomecollection.org/works/pkcssp5m',source_site='Wellcome Collection (material provided by University of Leeds Library)',document_delivery_note='The original source page offers the digitized historical volume; Botly does not host its scan.',source_license_type='Public Domain Mark; source credit required; check rights for the supplied scan and local jurisdiction',redistribution_allowed=false,attribution_required=true,legal_notes_internal='Wellcome record marks the work Public Domain Mark. External scan is linked only pending review of scan provenance and applicable terms.' where id='hildas-recipes';
update public.wellness_ebooks set public_display_title='Herbal Traditions & Botanicals',public_subtitle='Discover plants in historical reference works',slug='herbal-traditions-botanicals',summary_short='Explore a library-held historical botanical reference.',summary_long='This Botly catalog cover is not a Botly-authored ebook. The actual source is Wellcome Collection’s digitized copy of “Herbal Simples Approved for Modern Uses of Cure,” with a whole-item PDF available at the source. Botly links to that record and does not host the scan.',cover_image_url='/ebooks/library/botly-ebook-07-herbal-traditions-botanicals.webp',category_id='herbal-reference',tags=array['botanical history','herbs'],status='published',downloadable_file_url=null,source_title_original='Herbal Simples: Approved for Modern Uses of Cure',source_author='W. T. Fernie',source_url='https://wellcomecollection.org/works/yyu6fnvg',source_site='Wellcome Collection (material provided by Royal College of Physicians of Edinburgh)',document_delivery_note='The actual source page provides access to the digitized volume and whole-item PDF; Botly does not host it.',source_license_type='Public Domain Mark; source credit required; check rights for the supplied scan and local jurisdiction',redistribution_allowed=false,attribution_required=true,legal_notes_internal='Wellcome record indicates Public Domain Mark. Link out pending verification of scan provenance; historical medicinal claims are not advice.' where id='herbal-simples';
update public.wellness_ebooks set public_display_title='Nourishing Food Foundations',public_subtitle='Practical food and nutrition learning',slug='nourishing-food-foundations',summary_short='Explore a contemporary culinary medicine textbook at its publisher.',summary_long='This Botly catalog cover is not the textbook cover and is not a Botly-authored ebook. The actual document is “Culinary Medicine - 2025 Edition,” available online and as PDF/eBook from the publisher. Its listed CC BY-NC terms are non-commercial; Botly links to the original source and does not host or redistribute it.',cover_image_url='/ebooks/library/botly-ebook-08-nourishing-food-foundations.webp',category_id='nutrition',tags=array['nutrition','culinary medicine'],status='published',downloadable_file_url=null,source_title_original='Culinary Medicine – 2025 Edition',source_author='Cheryl Casey, Scott Going, Lauren McCullough, Melanie Hingle',source_url='https://open.umn.edu/opentextbooks/textbooks/culinary-medicine-2025-edition',source_site='Open Textbook Library / University of Arizona',document_delivery_note='The source offers online, PDF and eBook formats. This page links to the provider; Botly does not deliver a copy.',source_license_type='CC BY-NC (Attribution-NonCommercial)',redistribution_allowed=false,attribution_required=true,legal_notes_internal='Non-commercial Creative Commons license; no Botly hosting or commercial redistribution.' where id='culinary-medicine-2025';
update public.wellness_ebooks set public_display_title='The Herbal Tea Collection',public_subtitle='Explore botanical tea blends and rituals',slug='herbal-tea-collection',summary_short='Visit the publisher page for this herbal tea title.',summary_long='This Botly catalog cover is a collection label, not the original book cover. The actual ebook is “Herbal Tea Recipes & Remedies” hosted by Free-Ebooks.net. The page links to the provider; Botly has not verified a redistribution license and does not host the file.',cover_image_url='/ebooks/library/botly-ebook-09-herbal-tea-collection.webp',category_id='herbal-tea',tags=array['herbal tea','recipes'],status='published',downloadable_file_url=null,source_title_original='Herbal Tea Recipes & Remedies',source_author=null,source_url='https://www.free-ebooks.net/general-non-fiction/Herbal-Tea-Recipes-Remedies',source_site='Free-Ebooks.net',document_delivery_note='The actual ebook and its download are available on the source provider’s page, subject to its terms.',source_license_type='Redistribution permission unverified; link-out only',redistribution_allowed=false,attribution_required=true,legal_notes_internal='Do not host without written license confirmation and rights-holder verification.' where id='herbal-tea-recipes-remedies';
update public.wellness_ebooks set public_display_title='The Art of Herbal Infusions',public_subtitle='Learn to steep, brew and enjoy herbal tea',slug='art-of-herbal-infusions',summary_short='Explore the original educational page about preparing herbal teas.',summary_long='This Botly catalog cover is not an ACHS publication cover. The actual source is ACHS’s “Preparing Herbal Teas” resource page. Follow the provider page to see what material it makes available; Botly does not host a file.',cover_image_url='/ebooks/library/botly-ebook-10-art-of-herbal-infusions.webp',category_id='tea-preparation',tags=array['tea preparation','herbal infusions'],status='published',downloadable_file_url=null,source_title_original='Preparing Herbal Teas',source_author=null,source_url='https://achs.edu/about-us/research-papers-ebooks/preparing-herbal-teas-2/',source_site='American College of Healthcare Sciences',document_delivery_note='This is a source-page resource; Botly does not deliver a downloadable copy.',source_license_type='Reuse terms not stated on reviewed page; link-out only',redistribution_allowed=false,attribution_required=true,legal_notes_internal='No distribution permission found on reviewed page; link out.' where id='preparing-herbal-teas';
update public.wellness_ebooks set public_display_title='Herbal Syrups & Plant Preparations',public_subtitle='Traditional methods and recipe resources',slug='herbal-syrups-plant-preparations',summary_short='A curated route into individual community herbal resources.',summary_long='This is a resource collection, not one ebook. Grass Roots Remedies provides individual handouts and recipes under CC BY-NC-ND terms (credit required, non-commercial use only, no modifications). Botly links to the resource hub and does not host or bundle the files.',cover_image_url='/ebooks/library/botly-ebook-11-herbal-syrups-plant-preparations.webp',category_id='resource-collection',tags=array['herbal resources','recipes'],status='published',downloadable_file_url=null,source_title_original='Grass Roots Remedies resources',source_author='Individual materials have their own creators',source_url='https://grassrootsremedies.co.uk/resources/',source_site='Grass Roots Remedies Co-operative',document_delivery_note='The source contains multiple separate resources; there is no single ebook file. Open the hub to choose an individual item under its license.',source_license_type='CC BY-NC-ND (credit, non-commercial use, no derivatives)',redistribution_allowed=false,attribution_required=true,legal_notes_internal='A resource hub rather than a book. Individual items carry CC BY-NC-ND; do not bundle, modify or commercially redistribute.' where id='grass-roots-remedies';

insert into public.legal_review_logs (ebook_id,decision,jurisdiction,evidence_url,note_vi)
select id, case when redistribution_allowed then 'host' when source_url is not null then 'link_out' else 'pending' end,
 'global', source_url, legal_notes_internal from public.wellness_ebooks
on conflict do nothing;

alter table public.ebook_categories enable row level security;
alter table public.wellness_ebooks enable row level security;
alter table public.ebook_email_leads enable row level security;
alter table public.ebook_download_logs enable row level security;
alter table public.ebook_page_views enable row level security;
alter table public.ebook_article_links enable row level security;
alter table public.content_generation_logs enable row level security;
alter table public.legal_review_logs enable row level security;
alter table public.ebook_download_rate_limits enable row level security;
alter table public.content_generation_queue enable row level security;
revoke all on public.ebook_email_leads, public.ebook_download_logs, public.ebook_download_rate_limits,
 public.legal_review_logs, public.content_generation_logs from anon, authenticated;
revoke all on public.content_generation_queue from anon, authenticated;
revoke all on public.wellness_ebooks, public.ebook_categories, public.ebook_page_views, public.ebook_article_links from anon, authenticated;
grant select on public.ebook_categories, public.ebook_article_links to anon, authenticated;
grant all on public.wellness_ebooks, public.ebook_categories, public.ebook_email_leads,
 public.ebook_download_logs, public.ebook_page_views, public.ebook_article_links,
 public.content_generation_logs, public.legal_review_logs, public.ebook_download_rate_limits to service_role;
grant all on public.content_generation_queue to service_role;
create policy "Public ebook categories" on public.ebook_categories for select to anon, authenticated using (true);
create policy "Public article ebook links" on public.ebook_article_links for select to anon, authenticated using (true);
create view public.public_ebook_catalog with (security_invoker=false) as
 select id,public_display_title,public_subtitle,slug,summary_short,summary_long,cover_image_url,
 category_id,tags,status,language,featured,seo_title,seo_description,premium_only,
 case when downloadable_file_url like 'private:%' and redistribution_allowed then 'email-gated'
      when redistribution_allowed then downloadable_file_url else null end as downloadable_file_url
 from public.wellness_ebooks where status='published';
grant select on public.public_ebook_catalog to anon,authenticated;

create or replace function public.capture_ebook_lead(
 p_email text,p_name text,p_ebook_id text,p_locale text,p_source_page text,p_marketing boolean,p_bucket_hash text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_ebook public.wellness_ebooks; v_lead public.ebook_email_leads; v_attempts integer;
begin
 if p_email is null or length(p_email)>254 or p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
  raise exception using message='INVALID_EMAIL',errcode='P0001'; end if;
 if p_locale not in ('en','vi') then raise exception using message='INVALID_INPUT',errcode='P0001'; end if;
 insert into public.ebook_download_rate_limits values(p_bucket_hash,now(),1)
 on conflict(bucket_hash) do update set attempts=case when ebook_download_rate_limits.window_start < now()-interval '1 hour' then 1 else ebook_download_rate_limits.attempts+1 end,
 window_start=case when ebook_download_rate_limits.window_start < now()-interval '1 hour' then now() else ebook_download_rate_limits.window_start end
 returning attempts into v_attempts;
 if v_attempts>8 then raise exception using message='RATE_LIMITED',errcode='P0001'; end if;
 select * into v_ebook from public.wellness_ebooks where id=p_ebook_id and status='published';
 if not found then raise exception using message='EBOOK_NOT_FOUND',errcode='P0001'; end if;
 if v_ebook.downloadable_file_url is null or not v_ebook.redistribution_allowed then
  raise exception using message='LINK_OUT_ONLY',errcode='P0001'; end if;
 insert into public.ebook_email_leads(email,name,ebook_id,locale,source_page,marketing_consent_at)
 values(lower(trim(p_email)),nullif(trim(p_name),''),p_ebook_id,p_locale,left(coalesce(p_source_page,''),300),case when p_marketing then now() else null end)
 on conflict(email,ebook_id) do update set name=coalesce(excluded.name,ebook_email_leads.name),source_page=excluded.source_page,
 marketing_consent_at=coalesce(ebook_email_leads.marketing_consent_at,excluded.marketing_consent_at)
 returning * into v_lead;
 insert into public.ebook_download_logs(lead_id,ebook_id,source_page,event) values(v_lead.id,p_ebook_id,left(coalesce(p_source_page,''),300),'unlocked');
 if p_marketing then
  insert into public.newsletter_subscribers(email,locale,source,consented_at,status)
  values(lower(trim(p_email)),p_locale,'ebook:'||p_ebook_id,now(),'active')
  on conflict(email,locale) do update set source=excluded.source,consented_at=excluded.consented_at,status='active';
 end if;
 return jsonb_build_object('ok',true,'download_url',case when v_ebook.downloadable_file_url like 'private:%' then 'email-gated' else v_ebook.downloadable_file_url end,'lead_id',v_lead.id);
end; $$;
revoke all on function public.capture_ebook_lead(text,text,text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.capture_ebook_lead(text,text,text,text,text,boolean,text) to service_role;

create function public.get_ebook_admin_summary() returns jsonb
language sql security definer set search_path = '' as $$
 select jsonb_build_object(
  'ebook_total',(select count(*) from public.wellness_ebooks where status='published'),
  'ebook_hosted',(select count(*) from public.wellness_ebooks where status='published' and downloadable_file_url is not null and redistribution_allowed),
  'ebook_link_out',(select count(*) from public.wellness_ebooks where status='published' and source_url is not null and downloadable_file_url is null),
  'ebook_pending',(select count(*) from public.wellness_ebooks where status='draft'),
  'leads_total',(select count(*) from public.ebook_email_leads),
  'leads_today',(select count(*) from public.ebook_email_leads where created_at>=date_trunc('day',now())),
  'downloads_today',(select count(*) from public.ebook_download_logs where event='downloaded' and created_at>=date_trunc('day',now())),
  'page_views_total',(select count(*) from public.ebook_page_views),
  'articles_published',(select count(*) from public.wellness_article_translations where locale='en' and status='published' and published_at<=now()),
  'articles_queued',(select count(*) from public.content_generation_queue where status in ('queued','review','draft')),
  'leads_by_ebook',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (
    select e.id,e.public_display_title,count(distinct l.id) as leads,
      (select count(*) from public.ebook_download_logs d where d.ebook_id=e.id and d.event='downloaded') as downloads,
      (select count(*) from public.ebook_page_views v where v.ebook_id=e.id) as views,
      case when (select count(*) from public.ebook_page_views v where v.ebook_id=e.id)>0
        then round(count(distinct l.id)::numeric*100/(select count(*) from public.ebook_page_views v where v.ebook_id=e.id),1)
        else 0 end as conversion_rate
    from public.wellness_ebooks e left join public.ebook_email_leads l on l.ebook_id=e.id
    where e.status='published' group by e.id,e.public_display_title order by leads desc limit 20
  ) x),
  'leads_by_article',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (
    select source_page,count(*) as leads from public.ebook_email_leads
    where source_page like '%/guides/%' group by source_page order by leads desc limit 20
  ) x),
  'recent_schedule',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (
    select scheduled_for,status,topic_angle,source_ebook_id from public.content_generation_queue
    order by scheduled_for desc limit 14
  ) x)
 );
$$;
revoke all on function public.get_ebook_admin_summary() from public,anon,authenticated;
grant execute on function public.get_ebook_admin_summary() to service_role;

commit;
