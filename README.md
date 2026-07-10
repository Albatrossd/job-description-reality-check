# Job Description Reality Check

Paste a job posting, get a verdict: **Smash**, **Investigate**, **Yes If**, or **Pass**. Detects corporate euphemisms, red flag phrases, and unicorn signals — and tells you what they actually mean.

---

## Run it locally

You'll need [Node.js](https://nodejs.org/) installed (v18 or newer).

**1. Clone the repo**

```bash
git clone https://github.com/Albatrossd/job-description-reality-check.git
cd job-description-reality-check
```

**2. Install dependencies**

```bash
cd react-app
npm install
```

**3. Start the dev server**

```bash
npm run dev
```

**4. Open your browser**

Go to [http://localhost:5173](http://localhost:5173)

---

## Share on your local network (e.g. read on your phone)

```bash
npm run dev -- --host
```

The terminal will show a **Network** URL like `http://192.168.x.x:5173` — open that on any device on the same WiFi.

---

## How it works

- Scans the job description for known red flag phrases and explains what they really mean
- Detects negations (e.g. "we are *not* fast-paced") and reduces their score weight
- Looks for unicorn signals: async culture, small team, deep work, no meetings
- Parses compensation and checks it against a minimum threshold
- Combines everything into a single verdict with a breakdown of every matched phrase
