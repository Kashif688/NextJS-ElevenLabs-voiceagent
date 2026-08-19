import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Circle,
  Rect,
} from '@react-pdf/renderer';

export interface ContractProps {
  clientName?: string;
  date?: string;
  planName?: string;
  price?: string;
  representativeName?: string;
  scopeOfServices?: string[];
}

const BRAND_ORANGE = '#ea7a1e';
const BRAND_ORANGE_DARK = '#c86312';
const LIGHT_BG = '#eef0f3';
const WHITE = '#ffffff';
const TEXT_BLACK = '#1a1a1a';
const BORDER_GRAY = '#999999';
const YELLOW_HIGHLIGHT = '#fef533';

const styles = StyleSheet.create({
  page: {
    backgroundColor: LIGHT_BG,
    paddingTop: 14,
    paddingBottom: 24,
    paddingHorizontal: 0,
    fontFamily: 'Times-Roman',
    fontSize: 9.5,
    color: TEXT_BLACK,
    lineHeight: 1.35,
  },

  // Full-width Header Container
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },

  // Left White Logo Capsule
  leftCapsule: {
    backgroundColor: WHITE,
    borderTopRightRadius: 38,
    borderBottomRightRadius: 38,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    paddingLeft: 22,
    paddingRight: 32,
    paddingTop: 12,
    paddingBottom: 12,
    height: 72,
    flexDirection: 'column',
    justifyContent: 'center',
    width: 200,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoMphText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 34,
    color: BRAND_ORANGE,
    letterSpacing: -1,
    lineHeight: 0.9,
  },
  logoSub1: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#1a1a1a',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  logoSub2: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    color: '#808080',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  // Right Orange Contact Capsule
  rightCapsule: {
    backgroundColor: BRAND_ORANGE,
    borderTopLeftRadius: 36,
    borderBottomLeftRadius: 36,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingLeft: 22,
    paddingRight: 20,
    paddingVertical: 10,
    height: 72,
    width: 355,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: BRAND_ORANGE_DARK,
  },
  contactCol: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3.5,
  },
  iconContainer: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  contactTextPhone: {
    fontFamily: 'Times-Bold',
    fontSize: 7.8,
    color: WHITE,
  },
  contactTextWeb: {
    fontFamily: 'Times-Bold',
    fontSize: 7.2,
    color: WHITE,
  },
  contactTextEmail: {
    fontFamily: 'Times-Bold',
    fontSize: 7.2,
    color: WHITE,
  },
  contactTextAddr: {
    fontFamily: 'Times-Bold',
    fontSize: 7.2,
    color: WHITE,
  },

  // Content Wrapper with page margins
  contentWrapper: {
    paddingHorizontal: 28,
    flex: 1,
  },

  // Main Orange Banner
  orangeBanner: {
    backgroundColor: BRAND_ORANGE,
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  orangeBannerText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: WHITE,
    textAlign: 'center',
    letterSpacing: 0.4,
  },

  // White Card Container
  cardContainer: {
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 26,
    flex: 1,
  },

  // Section Typography
  docTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 15,
    textAlign: 'center',
    textDecoration: 'underline',
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
  },
  metaValueBold: {
    fontFamily: 'Times-Bold',
    fontSize: 10.5,
  },

  // Parties Box
  partiesBox: {
    borderWidth: 0.8,
    borderColor: BORDER_GRAY,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 14,
    textAlign: 'center',
  },
  partiesLine1: {
    textAlign: 'center',
    marginBottom: 4,
  },
  partiesLine2: {
    textAlign: 'center',
    marginBottom: 3,
  },
  partiesLine3: {
    textAlign: 'center',
  },

  sectionTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    marginTop: 10,
    marginBottom: 6,
  },
  sectionSubTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 9.5,
    marginTop: 6,
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 6,
  },
  bulletList: {
    marginVertical: 3,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletDot: {
    width: 14,
    fontFamily: 'Times-Bold',
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Times-Roman',
    fontSize: 9,
  },
  bulletTextBold: {
    flex: 1,
    fontFamily: 'Times-Bold',
    fontSize: 9,
  },

  // Highlighted Box
  highlightBox: {
    backgroundColor: YELLOW_HIGHLIGHT,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginVertical: 6,
    alignSelf: 'flex-start',
    borderRadius: 2,
  },
  highlightText: {
    fontFamily: 'Times-Bold',
    fontSize: 10.5,
    color: TEXT_BLACK,
  },

  // Signatures Card
  signatureCard: {
    backgroundColor: '#f6f6f8',
    borderWidth: 0.8,
    borderColor: '#d0d0d4',
    borderRadius: 12,
    marginTop: 14,
    overflow: 'hidden',
  },
  signatureHeaderBar: {
    backgroundColor: BRAND_ORANGE,
    flexDirection: 'row',
    paddingVertical: 6,
  },
  signatureHeaderCol: {
    width: '50%',
    textAlign: 'center',
  },
  signatureHeaderTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: WHITE,
    textAlign: 'center',
  },
  signatureHeaderSubtitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: WHITE,
    textAlign: 'center',
    marginTop: 2,
  },
  signatureBodyRow: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  signatureCol: {
    width: '50%',
    paddingHorizontal: 8,
  },
  sigLineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sigLabel: {
    fontFamily: 'Times-Bold',
    fontSize: 8.5,
    marginRight: 4,
  },
  sigUnderline: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: TEXT_BLACK,
    height: 12,
  },
  sigCursiveText: {
    fontFamily: 'Times-Italic',
    fontSize: 15,
    position: 'absolute',
    left: 55,
    bottom: 2,
    color: TEXT_BLACK,
  },
  dateTextCenter: {
    textAlign: 'center',
    fontFamily: 'Times-Bold',
    fontSize: 8.5,
  },
});

// Reusable Exact Header Component (Pure Vector/Text for Speed and Size)
const ContractHeader = () => (
  <View style={styles.headerContainer}>
    {/* Left Logo Capsule */}
    <View style={styles.leftCapsule}>
      <View style={styles.logoRow}>
        <Text style={styles.logoMphText}>MPH</Text>
      </View>
      <Text style={styles.logoSub1}>MARKETING AND</Text>
      <Text style={styles.logoSub2}>PUBLISHING HOUSE LLC</Text>
    </View>

    {/* Right Contact Capsule */}
    <View style={styles.rightCapsule}>
      {/* Column 1: Phone & Website */}
      <View style={[styles.contactCol, { width: 148 }]}>
        {/* Phone */}
        <View style={styles.contactItem}>
          <Svg viewBox="0 0 24 24" style={styles.iconContainer}>
            <Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#ffffff" />
          </Svg>
          <Text style={styles.contactTextPhone}>(229) 355-4499</Text>
        </View>

        {/* Website */}
        <View style={styles.contactItem}>
          <Svg viewBox="0 0 24 24" style={styles.iconContainer}>
            <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#ffffff" />
          </Svg>
          <Text style={styles.contactTextWeb}>Marketingandpublishinghousellc.com</Text>
        </View>
      </View>

      {/* Column 2: Email & Address */}
      <View style={[styles.contactCol, { width: 172 }]}>
        {/* Email */}
        <View style={styles.contactItem}>
          <Svg viewBox="0 0 24 24" style={styles.iconContainer}>
            <Path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#ffffff" />
          </Svg>
          <Text style={styles.contactTextEmail}>connect@marketingandpublishinghousellc.com</Text>
        </View>

        {/* Address */}
        <View style={styles.contactItem}>
          <Svg viewBox="0 0 24 24" style={styles.iconContainer}>
            <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ffffff" />
          </Svg>
          <Text style={styles.contactTextAddr}>3343 Peachtree Rd Atlanta, GA  30326</Text>
        </View>
      </View>
    </View>
  </View>
);

export const ContractDocument: React.FC<ContractProps> = ({
  clientName = 'Ron Boucher',
  date = 'August 5th, 2026',
  planName = 'Publishing Plan',
  price = '[To Be Determined]',
  representativeName = 'Emma',
  scopeOfServices = [
    'Professional Editing & Advanced Formatting according to the International Publishing Standards.',
    'Professional Typesetting & Proofreading.',
    'Amazon Author Central Page Setup.',
    'Book Profile & Summary Development.',
    'Print-on-Demand Setup.',
    '12 Custom Made Graphics/Illustrations.',
    'Category Selection & Optimization.',
    'Keyword Research & Optimization.',
    'Publishing on Amazon, Barnes & Nobles, LULU, Google Books & Apple Books.',
    'Book Cover Design (front, spine and back).',
    'ISBN & Barcode Assignment.',
    'Copyrights Registration and Library of Congress Control Number (LCCN)',
    'Multiple Book Formats (eBook, Paperback and Hardcover).',
    'Unlimited Revisions.',
    'Competitive Book Pricing Strategy.',
    'Dedicated Project Manager.',
  ],
}) => {
  return (
    <Document>
      {/* ================= PAGE 1 ================= */}
      <Page size="A4" style={styles.page}>
        <ContractHeader />

        <View style={styles.contentWrapper}>
          <View style={styles.orangeBanner}>
            <Text style={styles.orangeBannerText}>
              NON-DISCLOSURE AGREEMENT AND BOOK PUBLISHING CONTRACT
            </Text>
          </View>

          <View style={styles.cardContainer}>
            <Text style={styles.docTitle}>SERVICE CONTRACT</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>For:  </Text>
              <Text style={styles.metaValueBold}>{clientName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Dated:  </Text>
              <Text style={styles.metaValueBold}>{date}</Text>
            </View>

            {/* Parties Box */}
            <View style={styles.partiesBox}>
              <Text style={styles.partiesLine1}>This Agreement (“Agreement”) is made between:</Text>
              <Text style={styles.partiesLine2}>
                Publisher: <Text style={{ fontFamily: 'Times-Bold' }}>Marketing & Publishing House LLC</Text> represented by{' '}
                <Text style={{ fontFamily: 'Times-Bold' }}>{representativeName}</Text>
              </Text>
              <Text style={styles.partiesLine3}>
                and Author: <Text style={{ fontFamily: 'Times-Bold' }}>{clientName}</Text>
              </Text>
            </View>

            {/* Section 1 */}
            <Text style={styles.sectionTitle}>1. PURPOSE OF AGREEMENT</Text>
            <Text style={styles.paragraph}>
              This Agreement outlines the professional relationship between the Publisher and the Author for the proofreading,
              formatting, adjusting, designing & publishing of the Author’s drafted book.
            </Text>
            <Text style={styles.paragraph}>
              This contract also includes a binding Non-Disclosure Agreement (<Text style={{ fontFamily: 'Times-Italic' }}>NDA</Text>)
              protecting all content, materials, and communication shared between the parties.
            </Text>

            {/* Section 2 */}
            <Text style={styles.sectionTitle}>2. AUTHOR RESPONSIBILITIES</Text>
            <Text style={{ marginBottom: 4 }}>The Author agrees to:</Text>
            <View style={styles.bulletList}>
              {[
                'Provide the full manuscript and all required materials before project initiation.',
                'Respond to revisions within 3–5 business days and approves deliverables in a timely manner.',
                'Provide accurate details for book setup, metadata, and author information.',
                'Maintain clear and respectful communication throughout the project.',
                'The Author agrees to provide necessary access, credentials, or OTP related to account set up for publishing purposes.',
              ].map((text, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>

      {/* ================= PAGE 2 ================= */}
      <Page size="A4" style={styles.page}>
        <ContractHeader />

        <View style={styles.contentWrapper}>
          <View style={styles.cardContainer}>
            <Text style={styles.sectionTitle}>3. SCOPE OF SERVICES [{planName}]</Text>
            <Text style={styles.paragraph}>
              Publisher/Marketing Company agrees to perform the following services professionally and in a timely manner:
            </Text>

            <Text style={styles.sectionSubTitle}>Publishing Support:</Text>
            <View style={styles.bulletList}>
              {scopeOfServices.map((item, idx) => {
                const isSpecial = item.toLowerCase().includes('publishing on');
                return (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={isSpecial ? styles.bulletTextBold : styles.bulletText}>{item}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Page>

      {/* ================= PAGE 3 ================= */}
      <Page size="A4" style={styles.page}>
        <ContractHeader />

        <View style={styles.contentWrapper}>
          <View style={styles.cardContainer}>
            <Text style={styles.sectionTitle}>4. PAYMENT TERMS</Text>
            <Text style={{ marginBottom: 4 }}>The payment terms decided are as follows:</Text>

            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>• Total Investment: {price}</Text>
            </View>

            <Text style={{ marginTop: 4, marginBottom: 8 }}>
              The payment is to be paid up front unless otherwise decided by both parties.
            </Text>

            <Text style={styles.sectionSubTitle}>Refund Policy</Text>
            <View style={styles.bulletList}>
              {[
                'Refund applies only if the Company fails to deliver agreed services within the defined timeline due to internal fault.',
                'No refund applies if delays are caused by the Author (e.g., late feedback, incomplete materials).',
                'Work begins only after upfront payment is received if otherwise decided.',
                'The Author shall be entitled to request a refund if the Company materially fails to provide the services outlined in this Agreement in accordance with the agreed scope of work and professional standards.',
              ].map((text, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>5. TIMELINE & PROCESS</Text>
            <Text style={{ marginBottom: 4 }}>A full timeline will be provided after reviewing the project however:</Text>
            <View style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>The ideal timeline is 5-7 weeks or otherwise decided by both parties.</Text>
            </View>

            <Text style={styles.sectionTitle}>6. INTELLECTUAL PROPERTY RIGHTS</Text>
            <View style={styles.bulletList}>
              {[
                'Author retains 100% ownership of the manuscript.',
                'Author retains 100% ownership of the final edited manuscript.',
                'Author retains 100% ownership of all cover designs after full payment is completed.',
                'Publisher does not claim any rights, royalties, or creative control.',
                'All royalties earned belong solely to the Author.',
                'Publisher does not participate in royalty revenue.',
              ].map((text, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>7. NDA - CONFIDENTIALITY & NON-DISCLOSURE</Text>
            <Text style={{ marginBottom: 4 }}>Both parties agree that:</Text>
            <View style={styles.bulletList}>
              {[
                'All materials shared by the Author (manuscript, notes, images, drafts) will remain confidential.',
                'All discussions, strategies, and communication will remain between the publisher and Author.',
              ].map((text, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>

      {/* ================= PAGE 4 ================= */}
      <Page size="A4" style={styles.page}>
        <ContractHeader />

        <View style={styles.contentWrapper}>
          <View style={styles.cardContainer}>
            <View style={styles.bulletList}>
              {[
                'All files, documents, and intellectual property shall remain strictly confidential.',
                "The Author shall retain 100% ownership and all intellectual property rights to the Book at all times, notwithstanding the Publisher's involvement in managing, coordinating, or executing any aspect of the publishing process.",
              ].map((text, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionSubTitle}>The Publisher/Marketing Company shall not:</Text>
            <View style={styles.bulletList}>
              {[
                'Disclose manuscript content.',
                'Share drafts or files with third parties.',
                'Release any project details publicly without permission.',
              ].map((text, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionSubTitle}>The Author shall not:</Text>
            <View style={styles.bulletList}>
              {[
                'Disclose proprietary workflow, pricing structure, internal communication, or business processes of the Publisher.',
              ].map((text, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontFamily: 'Times-Italic', fontSize: 8.5, marginVertical: 4 }}>
              This NDA remains active even after the project ends.
            </Text>

            <Text style={styles.sectionTitle}>8. TERMINATION POLICY</Text>
            <Text style={{ marginBottom: 4 }}>Publisher/Marketing Support may terminate the Agreement if:</Text>
            <View style={styles.bulletList}>
              {[
                'Author becomes unresponsive for 14+ days unless there is a genuine reason behind it.',
                'Author engages in abusive conduct.',
                'Author files a false dispute or chargeback.',
              ].map((text, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.sectionSubTitle}>In all termination cases:</Text>
            <View style={styles.bulletList}>
              {[
                'No refunds.',
                'Publisher/Marketing Company is not obligated to deliver remaining work.',
              ].map((text, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>9. LIMITATION OF LIABILITY</Text>
            <Text style={{ marginBottom: 4 }}>Publisher/Marketing Support is not responsible for:</Text>
            <View style={styles.bulletList}>
              {[
                'Amazon printing delays.',
                'The Company shall not be liable for indirect, incidental, or consequential damages.',
                'Changes in Publishing Platforms Publishing Rules.',
                'Maximum liability shall not exceed the total amount paid under this agreement.',
              ].map((text, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>

      {/* ================= PAGE 5 ================= */}
      <Page size="A4" style={styles.page}>
        <ContractHeader />

        <View style={styles.contentWrapper}>
          <View style={styles.cardContainer}>
            <Text style={styles.sectionTitle}>10. GOVERNING LAW</Text>
            <Text style={styles.paragraph}>
              This Agreement shall be governed by and interpreted according to the laws of the State of Georgia, USA.
            </Text>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>11. ACCEPTANCE & SIGNATURES</Text>

            {/* Signatures Card */}
            <View style={styles.signatureCard}>
              <View style={styles.signatureHeaderBar}>
                <View style={styles.signatureHeaderCol}>
                  <Text style={styles.signatureHeaderTitle}>Author:</Text>
                  <Text style={styles.signatureHeaderSubtitle}>{clientName}</Text>
                </View>
                <View style={styles.signatureHeaderCol}>
                  <Text style={styles.signatureHeaderTitle}>Marketing & Publishing House LLC</Text>
                  <Text style={styles.signatureHeaderSubtitle}>{representativeName}</Text>
                </View>
              </View>

              <View style={styles.signatureBodyRow}>
                {/* Author Sig */}
                <View style={styles.signatureCol}>
                  <View style={styles.sigLineContainer}>
                    <Text style={styles.sigLabel}>Signature: </Text>
                    <View style={styles.sigUnderline} />
                  </View>
                  <Text style={styles.dateTextCenter}>Dated: {date}</Text>
                </View>

                {/* Publisher Sig */}
                <View style={styles.signatureCol}>
                  <View style={styles.sigLineContainer}>
                    <Text style={styles.sigLabel}>Signature: </Text>
                    <View style={styles.sigUnderline}>
                      <Text style={styles.sigCursiveText}>{representativeName}</Text>
                    </View>
                  </View>
                  <Text style={styles.dateTextCenter}>Dated: {date}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
export default ContractDocument;
