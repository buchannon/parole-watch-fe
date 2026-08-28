export const TERMS_TITLE = 'Parole Watch Terms & Conditions'
export const TERMS_UPDATED = 'Last updated: August 28, 2026'

export interface TermsSection {
  heading: string
  paragraphs: string[]
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    heading: 'What Parole Watch is',
    paragraphs: [
      'Parole Watch is a subscription service that tracks the parole status of Texas offenders. After you sign in, you add offenders to your account by their 8-digit TDCJ number, and Parole Watch periodically checks their public parole status and emails you when it changes. It also keeps a history of status changes for every offender you track.',
      'Accounts are organized by law firm: the name you enter at signup creates your firm\u2019s group, and everyone in your firm can manage the same set of tracked offenders.',
    ],
  },
  {
    heading: 'Accounts and security',
    paragraphs: [
      'You are responsible for keeping your account credentials confidential and for all activity that happens under your account. Please contact us if you believe your account has been compromised.',
    ],
  },
  {
    heading: 'Subscription, billing, and the 30-day guarantee',
    paragraphs: [
      'Parole Watch is a paid subscription billed through Stripe. You can manage or cancel your subscription at any time from the Settings page. Cancelling stops status monitoring when your current billing period ends; your tracked offenders remain on file as allowed by law.',
      '30-day money-back guarantee: if you are not satisfied within the first 30 days of your initial subscription, contact us and we will refund the first month you were charged. No questions asked.',
    ],
  },
  {
    heading: 'About the data we show',
    paragraphs: [
      'Offender information comes from public Texas records. We show it \u201cas is\u201d and make no warranty about its accuracy, completeness, or timeliness. Offender status can change between our checks, and we do not guarantee that every change is captured.',
      'Parole Watch is a monitoring aid only. It is not legal advice, and you should not rely on it alone for decisions that affect a person\u2019s legal rights.',
    ],
  },
  {
    heading: 'Limitation of liability',
    paragraphs: [
      'To the maximum extent permitted by law, Parole Watch and its operators are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the service or from reliance on the data it provides.',
    ],
  },
  {
    heading: 'Changes to these terms',
    paragraphs: [
      'We may update these terms from time to time. Updates take effect when they are posted, and continuing to use Parole Watch after an update means you accept the revised terms.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      'Questions about these terms or about Parole Watch? Visit https://hire.jshowers.com to get in touch with the operator, J Showers Digital Consulting LLC.',
    ],
  },
]

export const TERMS_TEXT = [
  TERMS_TITLE,
  TERMS_UPDATED,
  '',
  ...TERMS_SECTIONS.map((section) => `${section.heading}\n\n${section.paragraphs.join('\n\n')}`),
].join('\n\n')
