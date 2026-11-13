-- These are original, unmodified Project Gutenberg EPUBs. Their embedded
-- Project Gutenberg license and source credits are retained in each file.
-- Source catalog pages mark the editions public domain in the United States.
-- Review of the authorship/publication record and Vietnam term supports this
-- initial Botly audience; other launch territories require separate review.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ebook-downloads','ebook-downloads',false,50000000,array['application/epub+zip','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

update public.wellness_ebooks
set downloadable_file_url = 'private:pg-18487.epub',
    redistribution_allowed = true,
    source_license_type = 'Project Gutenberg source EPUB; public domain in the United States; original file and embedded license retained; Vietnam territory reviewed',
    document_delivery_note = 'The original Project Gutenberg EPUB, unmodified and including its source credits/license, is downloaded from Botly after email capture. The supplied Botly cover is a separate catalog image.',
    summary_long = 'This Botly catalog cover is separate from the source ebook. After email capture, Botly delivers the original, unmodified Project Gutenberg EPUB. The EPUB retains its source credits and license. Historical health statements are not current medical guidance.',
    legal_notes_internal = 'Project Gutenberg marks this edition public domain in the US. Vietnam textual-work term reviewed under IP Law Article 27; maintain source EPUB unmodified with embedded license. Reassess before enabling other territories. Historical remedy claims are not medical advice.',
    updated_at = now()
where id = 'food-remedies';

update public.wellness_ebooks
set downloadable_file_url = 'private:pg-78781.epub',
    redistribution_allowed = true,
    source_license_type = 'Project Gutenberg source EPUB; public domain in the United States; original file and embedded license retained; Vietnam territory reviewed',
    document_delivery_note = 'The original Project Gutenberg EPUB, unmodified and including its source credits/license, is downloaded from Botly after email capture. The supplied Botly cover is a separate catalog image.',
    summary_long = 'This Botly catalog cover is separate from the source ebook. After email capture, Botly delivers the original, unmodified Project Gutenberg EPUB. The EPUB retains its source credits and license. Historical health statements are not current medical guidance.',
    legal_notes_internal = 'Project Gutenberg marks this edition public domain in the US. Vietnam textual-work term reviewed under IP Law Article 27; maintain source EPUB unmodified with embedded license. Reassess before enabling other territories. Historical remedy claims are not medical advice.',
    updated_at = now()
where id = 'healthy-life-beverage-book';

update public.wellness_ebooks
set downloadable_file_url = null,
    redistribution_allowed = false,
    source_license_type = 'Project Gutenberg labels this edition public domain in the United States; Vietnam distribution review is incomplete',
    document_delivery_note = 'The actual source EPUB remains at Project Gutenberg. Botly does not distribute a copy while local redistribution status is under review.',
    summary_long = 'This Botly catalog cover is separate from the source ebook. The original work is available from Project Gutenberg; Botly currently links to the source and does not host its file.',
    legal_notes_internal = 'Project Gutenberg marks this edition public domain in the US, but the author death date has not been verified for territory-specific review. Keep link-out only until documented.',
    updated_at = now()
where id = 'mothers-remedies';

update public.wellness_ebooks
set downloadable_file_url = 'private:pg-53951.epub',
    redistribution_allowed = true,
    source_license_type = 'Project Gutenberg source EPUB; public domain in the United States; original file and embedded license retained; Vietnam territory reviewed',
    document_delivery_note = 'The original Project Gutenberg EPUB, unmodified and including its source credits/license, is downloaded from Botly after email capture. The supplied Botly cover is a separate catalog image.',
    summary_long = 'This Botly catalog cover is separate from the source ebook. After email capture, Botly delivers the original, unmodified Project Gutenberg EPUB. The EPUB retains its source credits and license. Historical health statements are not current medical guidance.',
    legal_notes_internal = 'Project Gutenberg marks this edition public domain in the US. Vietnam textual-work term reviewed under IP Law Article 27; maintain source EPUB unmodified with embedded license. Reassess before enabling other territories.',
    updated_at = now()
where id = 'a-book-of-simples';

update public.wellness_ebooks
set downloadable_file_url = 'private:pg-49513.epub',
    redistribution_allowed = true,
    source_license_type = 'Project Gutenberg source EPUB; public domain in the United States; original file and embedded license retained; Vietnam territory reviewed',
    document_delivery_note = 'The original Project Gutenberg EPUB, unmodified and including its source credits/license, is downloaded from Botly after email capture. The supplied Botly cover is a separate catalog image.',
    summary_long = 'This Botly catalog cover is separate from the source ebook. After email capture, Botly delivers the original, unmodified Project Gutenberg EPUB. The EPUB retains its source credits and license. Historical herbal recommendations are not current medical guidance.',
    legal_notes_internal = 'Project Gutenberg marks this edition public domain in the US. Vietnam textual-work term reviewed under IP Law Article 27; maintain source EPUB unmodified with embedded license. Reassess before enabling other territories. Historical herbal recommendations may be unsafe.',
    updated_at = now()
where id = 'complete-herbal';

update public.wellness_ebooks
set downloadable_file_url = 'private:wellcome-b21528433.pdf',
    redistribution_allowed = true,
    source_license_type = 'Public Domain Mark; Wellcome states use is unrestricted under copyright law; attribution required',
    attribution_required = true,
    document_delivery_note = 'The 459-page Wellcome scan is downloaded from Botly after email capture in two PDF volumes (pages 1–230 and 231–459) to fit the private storage file-size limit. Page content is retained; the Botly catalog cover is separate.',
    summary_long = 'This Botly catalog cover is separate from the digitised source work. After email capture, Botly delivers the Wellcome scan in two PDF volumes. Wellcome marks the work Public Domain Mark and requests source credit.',
    legal_notes_internal = 'Official Wellcome work page marks Public Domain Mark and says any-purpose use is unrestricted under copyright law. Preserve Wellcome credit. The digital item was provided by University of Leeds Library.',
    updated_at = now()
where id = 'hildas-recipes';

update public.wellness_ebooks
set downloadable_file_url = 'private:wellcome-b21908679.pdf',
    redistribution_allowed = true,
    source_license_type = 'Public Domain Mark; Wellcome states use is unrestricted under copyright law; attribution required',
    attribution_required = true,
    document_delivery_note = 'The complete digitised scan PDF from Wellcome Collection is downloaded from Botly after email capture. It is source-generated and unmodified; the Botly catalog cover is separate.',
    summary_long = 'This Botly catalog cover is separate from the digitised source work. After email capture, Botly delivers the original Wellcome Collection scan as a PDF. Wellcome marks the work Public Domain Mark and requests source credit.',
    legal_notes_internal = 'Official Wellcome work page marks Public Domain Mark and says any-purpose use is unrestricted under copyright law. Preserve Wellcome credit. The digital item was provided by the Royal College of Physicians of Edinburgh.',
    updated_at = now()
where id = 'herbal-simples';

-- Never expose the private storage key through the public listing view or RPC.
create or replace view public.public_ebook_catalog with (security_invoker=false) as
select id,public_display_title,public_subtitle,slug,summary_short,summary_long,cover_image_url,
       category_id,tags,status,language,featured,seo_title,seo_description,premium_only,
       case when downloadable_file_url like 'private:%' and redistribution_allowed then 'email-gated'
            when redistribution_allowed then downloadable_file_url else null end as downloadable_file_url
from public.wellness_ebooks where status='published';

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
 insert into public.ebook_download_logs(lead_id,ebook_id,source_page,event)
 values(v_lead.id,p_ebook_id,left(coalesce(p_source_page,''),300),'unlocked');
 if p_marketing then
  insert into public.newsletter_subscribers(email,locale,source,consented_at,status)
  values(lower(trim(p_email)),p_locale,'ebook:'||p_ebook_id,now(),'active')
  on conflict(email,locale) do update set source=excluded.source,consented_at=excluded.consented_at,status='active';
 end if;
 return jsonb_build_object('ok',true,'download_url',case when v_ebook.downloadable_file_url like 'private:%' then 'email-gated' else v_ebook.downloadable_file_url end,'lead_id',v_lead.id);
end; $$;
revoke all on function public.capture_ebook_lead(text,text,text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.capture_ebook_lead(text,text,text,text,text,boolean,text) to service_role;
