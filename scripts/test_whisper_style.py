import asyncio
import edge_tts
from edge_tts import communicate

def whisper_mkssml(tc, escaped_text):
    if isinstance(escaped_text, bytes):
        escaped_text = escaped_text.decode('utf-8')
    return (
        "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>"
        f"<voice name='{tc.voice}'>"
        f"<prosody pitch='{tc.pitch}' rate='{tc.rate}' volume='{tc.volume}'>"
        f"<mstts:express-as style='whispering'>{escaped_text}</mstts:express-as>"
        "</prosody>"
        "</voice>"
        "</speak>"
    )

communicate.mkssml = whisper_mkssml

async def run():
    voices = ['en-US-JennyNeural', 'en-US-AriaNeural', 'en-US-GuyNeural']
    for voice in voices:
        try:
            comm = edge_tts.Communicate('Rest now. Let your mind drift peacefully into the night.', voice=voice, rate='-18%', pitch='-2Hz')
            out_file = f'test_whisper_{voice}.mp3'
            await comm.save(out_file)
            print(f'SUCCESS for {voice} with style=whispering -> {out_file}!')
        except Exception as e:
            print(f'Failed {voice}:', e)

if __name__ == '__main__':
    asyncio.run(run())
