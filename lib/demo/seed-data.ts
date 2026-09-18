// Synthetic demo papers — original text written for this project, not
// reproductions of any real publication. Used to power the public /demo
// workspace so visitors can try search, chat, summarization, and comparison
// without uploading anything or creating an account.

export type DemoPaper = {
  slug: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  keywords: string[];
  pages: string[];
};

export const DEMO_PAPERS: DemoPaper[] = [
  {
    slug: "bengali-speech-recognition-dnn",
    title: "Bengali Speech Recognition Using Deep Neural Networks",
    authors: ["A. Rahman", "S. Chowdhury"],
    year: 2025,
    abstract:
      "We present a deep neural network pipeline for automatic speech recognition (ASR) in Bengali, a low-resource language relative to English and Mandarin. Our system combines a convolutional feature extractor with a bidirectional LSTM acoustic model and a statistical language model trained on a curated Bengali news and conversational corpus. On a held-out test set drawn from six dialect regions, the system achieves a word error rate of 18.4%, a substantial improvement over the 27.1% baseline from a prior HMM-GMM system.",
    keywords: ["speech recognition", "Bengali", "deep learning", "low-resource ASR"],
    pages: [
      `1. Introduction. Automatic speech recognition for Bengali remains comparatively underdeveloped despite the language having over 230 million speakers worldwide. Existing commercial systems are trained primarily on standard Dhaka-dialect speech and degrade sharply on regional dialects from Sylhet, Chittagong, and Rajshahi. This paper addresses the research problem of building a dialect-robust Bengali ASR system using a modest amount of labeled data, since large annotated corpora comparable to English LibriSpeech do not yet exist for Bengali.

2. Related Work. Prior systems for Bengali ASR have relied on hidden Markov model / Gaussian mixture model (HMM-GMM) architectures, which handle acoustic variability poorly. Recent transformer-based multilingual models such as Whisper show promise but are not fine-tuned specifically for Bengali dialectal variation, and their large size makes on-device deployment impractical for many use cases in the region.`,
      `3. Methodology. Our acoustic model consists of a 6-layer convolutional feature extractor followed by a 3-layer bidirectional LSTM with 512 hidden units per direction, trained with connectionist temporal classification (CTC) loss. We augment training audio with speed perturbation (0.9x-1.1x) and additive background noise sampled from a Bengali-language field-recording noise bank. A 4-gram statistical language model, trained on a 40-million-word corpus of Bengali news text and transcribed conversational speech, is used for beam-search decoding with the acoustic model.

4. Dataset. Training data consists of 340 hours of transcribed Bengali speech collected from radio broadcasts, volunteer read-speech recordings, and a subset of the OpenSLR Bengali corpus. The test set consists of 12 hours held out across six dialect regions (60 speakers, balanced by gender), none of whose speakers appear in training.`,
      `5. Results. The proposed system achieves a word error rate (WER) of 18.4% on the combined test set, compared to 27.1% for a reimplemented HMM-GMM baseline and 22.9% for an off-the-shelf multilingual transformer baseline without dialect fine-tuning. Performance varies by dialect: Dhaka-standard speech achieves 14.2% WER, while Sylheti speech — the most phonologically distinct dialect in our test set — achieves 26.7% WER, indicating dialect coverage remains the primary bottleneck.

6. Limitations. Our training corpus, while larger than prior Bengali ASR work, remains two orders of magnitude smaller than English ASR training sets. Performance on Sylheti and other minority dialects lags well behind standard Bengali, and the system has not been evaluated on children's speech or speech from speakers with speech-language disorders. We did not evaluate real-time streaming performance, only offline batch transcription.

7. Future Work. Future work should expand dialectal coverage, particularly for Sylheti and Chittagonian speech, and explore self-supervised pretraining on unlabeled Bengali audio (of which far more is available than transcribed audio) to reduce reliance on scarce labeled data.`,
    ],
  },
  {
    slug: "bengali-aphasia-detection-dl",
    title: "Bengali Aphasia Detection Using Deep Learning",
    authors: ["N. Islam", "F. Akter", "R. Hasan"],
    year: 2026,
    abstract:
      "Aphasia, a language disorder commonly resulting from stroke, is underdiagnosed in Bengali-speaking populations due to a lack of language-specific screening tools. We propose a deep learning classifier that analyzes recorded spontaneous speech to detect signs of aphasia, distinguishing fluent from non-fluent presentations. Trained on a clinically-annotated dataset of 180 speakers, the model achieves 86.3% accuracy in binary aphasia detection and 74.1% accuracy in the harder three-way fluency classification task.",
    keywords: ["aphasia", "speech disorder detection", "Bengali", "deep learning", "clinical NLP"],
    pages: [
      `1. Introduction. Aphasia affects language production and comprehension, most often following a stroke, and early detection significantly improves rehabilitation outcomes. Screening tools for aphasia are well established in English and a handful of other high-resource languages, but no validated automated screening tool exists for Bengali, despite Bangladesh's high stroke incidence. This paper addresses that gap by framing aphasia screening as a speech classification problem.

2. Related Work. Automated aphasia detection in English has used both acoustic features (pause patterns, speech rate, pitch variability) and linguistic features (lexical diversity, syntactic complexity) extracted from transcribed speech, typically with support vector machines or, more recently, transformer-based text classifiers. These approaches have not been validated on Bengali, whose morphology and typical clinical presentation of aphasia differ from English in ways that may affect which features are diagnostic.`,
      `3. Methodology. We extract a combined feature set: (a) acoustic features — pause frequency and duration, articulation rate, pitch variability — computed directly from audio; and (b) linguistic features — type-token ratio, mean utterance length, and grammatical error rate — computed from ASR transcripts. These features feed a two-stage classifier: a binary aphasia/non-aphasia stage, followed by a three-way fluent/non-fluent/mixed classification stage for speakers flagged as aphasic, both implemented as feedforward networks with dropout regularization.

4. Dataset. Speech samples come from 180 speakers recruited through two hospital speech-language pathology clinics in Dhaka: 95 clinically diagnosed aphasia patients (spanning fluent, non-fluent, and mixed presentations per standard clinical assessment) and 85 age-matched controls. Each speaker provided a 3-5 minute spontaneous speech sample (picture description task), which clinicians independently labeled.`,
      `5. Results. The binary aphasia/non-aphasia classifier achieves 86.3% accuracy (AUC 0.91) on held-out speakers. The harder three-way fluency subtype classification achieves 74.1% accuracy, with the mixed-presentation category proving most difficult to separate from non-fluent aphasia (the two are confused in 31% of mixed cases). Pause frequency and articulation rate were the two most predictive individual features by ablation, consistent with clinical literature on non-fluent aphasia presentations.

6. Limitations. Our dataset, while among the largest Bengali clinical speech datasets assembled for this purpose, is still modest by machine learning standards (180 speakers) and drawn from only two clinical sites in one city, limiting generalizability to other regions and dialects. The model has not been validated prospectively as a screening tool in a live clinical workflow, only retrospectively on already-diagnosed patients. We also did not stratify performance by aphasia severity.

7. Future Work. Prospective clinical validation, multi-site data collection across dialect regions, and severity-stratified evaluation are the clearest next steps. Combining this approach with the acoustic modeling techniques from general-purpose Bengali ASR research could also improve transcript quality and, in turn, classification accuracy.`,
    ],
  },
  {
    slug: "transformer-low-resource-speech",
    title: "Transformer-Based Architectures for Low-Resource Speech Recognition",
    authors: ["M. Chen", "P. Okafor"],
    year: 2025,
    abstract:
      "Transformer-based acoustic models have driven major gains in high-resource speech recognition but are typically data-hungry, limiting their direct applicability to low-resource languages. We survey transfer-learning strategies for adapting large multilingual transformer models (such as wav2vec 2.0 and Whisper) to low-resource target languages, and propose a staged fine-tuning recipe that reduces the labeled data required to reach a target word error rate by roughly 60% compared to fine-tuning from scratch.",
    keywords: ["transformers", "speech recognition", "low-resource languages", "transfer learning", "wav2vec"],
    pages: [
      `1. Introduction. Transformer architectures, first popularized in machine translation, now underpin state-of-the-art speech recognition through models like wav2vec 2.0 and Whisper. These models are pretrained on tens or hundreds of thousands of hours of audio, most of it in a small number of high-resource languages. For the thousands of languages with little to no transcribed speech data, directly fine-tuning such models often still requires more labeled data than is available, motivating research into more data-efficient adaptation strategies.

2. Related Work. Prior transfer learning approaches for low-resource ASR include multilingual joint training, where a single model is trained across many languages simultaneously, and cross-lingual phoneme mapping, which reuses phoneme inventories from related high-resource languages. Self-supervised pretraining objectives (as in wav2vec 2.0) have shown particular promise because they learn general acoustic representations from unlabeled audio, which is more abundant than transcribed audio even for low-resource languages.`,
      `3. Methodology. We propose a three-stage fine-tuning recipe: (1) continued self-supervised pretraining of a wav2vec 2.0-style model on unlabeled target-language audio, (2) supervised fine-tuning on a small labeled subset with layer-wise learning rate decay to preserve pretrained representations in early layers, and (3) a final fine-tuning pass with SpecAugment-style data augmentation on the full labeled set. This staged approach is designed to make the most of both abundant unlabeled audio and scarce labeled audio.

4. Dataset. We evaluate on five low-resource languages spanning three language families, each with between 20 and 80 hours of labeled speech and 300-600 hours of unlabeled audio available. Language selection prioritized typological diversity (tonal and non-tonal, agglutinative and isolating) to test whether the recipe's benefits generalize across linguistic structure.`,
      `5. Results. Across the five evaluated languages, the staged fine-tuning recipe reaches a target word error rate using roughly 60% less labeled data on average than fine-tuning a pretrained model directly on the full labeled set, and roughly 75% less than training from scratch. Gains are largest for the two most severely low-resource languages in the study (under 30 hours labeled), where the additional unlabeled pretraining stage appears to compensate most for limited supervision.

6. Limitations. Our study covers five languages, which is a broad but still limited sample from the world's linguistic diversity; results may not transfer to languages with very different phonological inventories or to extremely low-resource settings (under 5 hours labeled) not tested here. We also did not evaluate inference-time computational cost, which matters for on-device deployment in the resource-constrained settings where these languages are typically spoken.

7. Future Work. Testing the recipe on languages with fewer than 5 hours of labeled data, and combining it with model compression techniques for on-device deployment, are natural next steps. Extending the comparison to include large general-purpose multilingual models like Whisper as a baseline for the staged recipe itself (rather than only as a pretrained starting point) would also clarify when staged fine-tuning is worth the added complexity.`,
    ],
  },
  {
    slug: "code-switched-speech-to-text",
    title: "Robust Speech-to-Text Systems for Code-Switched Bengali-English Audio",
    authors: ["T. Ahmed", "L. Zhang"],
    year: 2026,
    abstract:
      "Code-switching between Bengali and English is pervasive in everyday spoken communication in urban Bangladesh, particularly among younger speakers, but most speech-to-text systems are trained on monolingual data and perform poorly on mixed-language audio. We introduce a speech-to-text system trained on a purpose-built code-switched corpus and a language-aware decoding strategy that improves transcription accuracy on mixed-language utterances by 22% relative to a monolingual Bengali baseline, with minimal degradation on monolingual speech.",
    keywords: ["code-switching", "speech-to-text", "Bengali-English", "bilingual NLP"],
    pages: [
      `1. Introduction. Code-switching — alternating between two or more languages within a single conversation or even a single sentence — is common in bilingual and multilingual communities worldwide, including among Bengali-English bilingual speakers in urban Bangladesh. Standard ASR systems, trained on monolingual corpora, frequently misrecognize code-switched segments, either by forcing an incorrect single-language interpretation or by failing to detect the language switch entirely. This paper addresses the research problem of building a speech-to-text system that handles Bengali-English code-switching robustly.

2. Related Work. Prior code-switching ASR research has largely focused on language pairs like Mandarin-English and Hindi-English, where large code-switched corpora have been collected. Approaches include training a single acoustic model on mixed-language data, using a language identification model to route audio segments to language-specific decoders, and, more recently, end-to-end models with a unified multilingual output vocabulary. Bengali-English code-switching has received comparatively little attention despite its prevalence.`,
      `3. Methodology. Our system uses a single end-to-end transformer acoustic model with a shared Bengali-English subword vocabulary, avoiding the need for explicit language identification at inference time. During decoding, we apply a language-aware language model that interpolates separately-trained Bengali and English n-gram models, weighted dynamically based on the language distribution of recently decoded tokens, which we found reduces spurious language switches compared to a single interpolated model with fixed weights.

4. Dataset. We collected 65 hours of code-switched Bengali-English speech from university students and young professionals in Dhaka, recorded in informal conversational settings (casual conversation, class discussion, phone calls), along with 40 hours of monolingual Bengali and 20 hours of monolingual English speech from the same speaker pool for comparison and to prevent the model from overfitting to switching behavior.`,
      `5. Results. On code-switched test audio, our system achieves a mixed-error rate (a code-switching-aware variant of word error rate) of 24.6%, a 22% relative improvement over a monolingual Bengali ASR baseline evaluated on the same audio (31.5% mixed-error rate) and a 31% relative improvement over a monolingual English baseline (35.8%). On purely monolingual Bengali test audio, our system's word error rate (19.1%) is only marginally worse than a Bengali-only baseline (18.4%), indicating the code-switching adaptation does not meaningfully harm monolingual performance.

6. Limitations. Our corpus was collected primarily from university-educated young adults in Dhaka, and code-switching patterns — and the vocabulary switched into English — likely differ among other demographic groups, other cities, and older speakers. We also did not evaluate performance on three-way code-switching involving regional Bengali dialects alongside English, which anecdotally also occurs in the target population.

7. Future Work. Broadening the speaker demographic and dialect coverage of the code-switched training corpus is the clearest priority. Investigating whether the language-aware decoding strategy transfers to other code-switching language pairs, and to code-switching involving more than two languages, would also help establish how much of this approach is Bengali-English-specific versus generally applicable.`,
    ],
  },
];
