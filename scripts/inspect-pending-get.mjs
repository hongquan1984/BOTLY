async function test() {
  const actRes = await fetch("http://127.0.0.1:3329/api/healthclues/account/quick-activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "hongquan0508@gmail.com" }),
  });
  const actData = await actRes.json();
  const token = actData.session.access_token;

  const res = await fetch("http://127.0.0.1:3329/api/healthclues/pending-journey", {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("pending-journey GET status:", res.status);
  const data = await res.json();
  console.log("pending-journey GET data:", data);
}

test().catch(console.error);
