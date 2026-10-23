"use strict";

const REVIEWED_DATE = "2026-08-30";

const belief = (id, title, takeaway, details) => ({
    id,
    title,
    takeaway,
    details,
    reviewedDate: REVIEWED_DATE
});

const categories = [
    {
        id: "democracy",
        title: "Democracy",
        introduction: "How I think elections and democratic institutions should represent people.",
        beliefs: [
            belief("voting-access", "Voting access", "I favor a broad federal baseline for access to the ballot.", "I would guarantee automatic and same-day registration, substantial early voting, no-excuse mail voting, free identification, and auditable election safeguards. I think access and security should reinforce one another rather than be treated as opposing goals."),
            belief("presidential-elections", "Presidential elections", "I would replace the Electoral College with a ranked national popular vote.", "Every vote should carry the same mathematical weight, and ranked-choice tabulation should produce a majority-supported winner without a separate runoff. This would require a constitutional change and would reduce the special influence of a few competitive states."),
            belief("campaign-finance", "Campaign finance", "I support contribution limits and strong disclosure within a privately financed system.", "I want enforceable limits on direct donations and prompt transparency about meaningful political spending. I do not currently favor public matching funds, and I recognize that regulation must respect political speech and association."),
            belief("house-representation", "House representation", "I favor proportional representation through multi-member House districts.", "Seats should reflect voters' overall preferences more closely and give political minorities a realistic voice. This would weaken gerrymandering, although it would also make coalition government and larger districts more common."),
            belief("ranked-choice-voting", "Ranked-choice voting", "I support ranked-choice voting in federal elections.", "Voters should be able to express an honest preference without the same spoiler pressure created by plurality elections. Ballots and counting rules would need clear design and voter education so the added choice does not become needless confusion."),
            belief("supreme-court", "Supreme Court reform", "I support nine justices, regular 18-year terms, and enforceable ethics rules.", "Staggered terms would make appointments more predictable while retaining judicial independence. Ethics, disclosure, and recusal requirements should be binding; implementing term limits may require a constitutional amendment."),
        ]
    },
    {
        id: "economy",
        title: "Economy",
        beliefs: [
            belief("progressive-taxation", "Taxation", "I favor a more progressive federal tax system.", "Very high incomes, capital gains, large inheritances, and highly profitable corporations should contribute more while low- and middle-income households are protected. Rates still need to be designed around avoidance, investment incentives, and the revenue programs actually require."),
            belief("worker-pay", "Worker pay", "I prefer refundable credits and portable benefits alongside a moderate wage floor.", "I want work to provide a viable living, but I am cautious about relying on aggressive national wage mandates across very different regional labor markets. Public credits and portable benefits should support workers without tying security entirely to one employer."),
            belief("basic-income", "Universal basic income", "I support a universal basic income in addition to existing targeted benefits.", "A regular cash payment would give everyone a dependable floor and more freedom to handle changing work and family needs. I would preserve disability, housing, healthcare, and other targeted programs, which makes this an expensive commitment requiring substantial new revenue."),
        ]
    },
    {
        id: "healthcare",
        title: "Healthcare",
        beliefs: [
            belief("universal-healthcare", "Universal coverage", "I support universal multipayer healthcare with a strong public option.", "Everyone should be automatically able to obtain meaningful coverage while regulated employer and private plans remain available. This preserves choice, although it retains more administrative complexity than a single-payer system."),
            belief("prescription-drugs", "Prescription drugs", "I support negotiation, patient cost caps, generic competition, and patent reform.", "Public programs should negotiate prices, and the law should curb patent strategies that extend monopolies without genuine invention. Time-limited rewards still matter because developing useful medicines is risky and expensive."),
            belief("reproductive-care", "Reproductive care", "I support federal protection for abortion before viability and contraception nationwide.", "After viability, abortion should remain available for serious medical circumstances determined with appropriate clinical judgment. I give substantial weight to bodily autonomy while recognizing that disagreement about developing life makes this a profound moral conflict."),
        ]
    },
    {
        id: "education-housing",
        title: "Education & Housing",
        beliefs: [
            belief("public-schools", "K–12 education", "I want stronger public schools, accountable nonprofit charters, and no private-school vouchers.", "Funding and educational opportunity should not depend so heavily on a child's neighborhood. Charter schools can offer useful alternatives when they are transparent and accountable, but public money should remain in public education rather than subsidize private tuition."),
            belief("higher-education", "College and career training", "I support tuition-free public colleges and accredited trade programs.", "Public two- and four-year education should be available without tuition, with strong investment in apprenticeships and trades. Existing student-debt relief should be targeted rather than universal so policy also helps people who avoided or repaid debt."),
            belief("housing-affordability", "Housing affordability", "I support more housing supply together with public support and tenant protection.", "Government should encourage denser housing and faster permits while also building social housing, expanding vouchers, and preventing displacement. Market construction matters, but private supply alone will not reliably serve every low-income household."),
        ]
    },
    {
        id: "climate-energy",
        title: "Climate & Energy",
        beliefs: [
            belief("climate-policy", "Climate policy", "I prefer innovation, incentives, and adaptation over broad mandates or carbon pricing.", "Government should fund research, infrastructure, resilience, and voluntary adoption of cleaner technology. This approach may be less certain to hit a particular emissions deadline, but I prefer it to an economy-wide price or prescriptive regulatory program."),
            belief("energy-mix", "Energy mix", "I want a renewables-dominant system that retires nuclear and fossil generation over time.", "Wind, solar, storage, efficiency, and transmission should become the backbone of the grid. Retiring dispatchable nuclear power while avoiding broad mandates places a heavy burden on storage, grid expansion, demand management, and future technological progress."),
            belief("permitting", "Permitting", "I support broadly faster approval of infrastructure and industrial projects.", "Energy, housing, transportation, and manufacturing projects should face firm deadlines and less duplicative review. Speed must still leave a meaningful path to identify concrete harms, but litigation and process should not become indefinite vetoes."),
        ]
    },
    {
        id: "civil-rights",
        title: "Civil Rights",
        beliefs: [
            belief("lgbtq-rights", "LGBTQ rights", "I support comprehensive federal protection against discrimination.", "Sexual orientation and gender identity should be protected in employment, housing, education, credit, and public accommodations. Exceptions should be narrow and focused on the internal religious functions of faith organizations."),
            belief("race-policy", "Race and public policy", "I favor formal racial neutrality in government policy.", "Government should enforce laws against intentional discrimination strongly but should not distribute benefits or burdens by race. I prefer individual and economic criteria over group-targeted remedies, even when neutral rules do not erase every disparity."),
            belief("religious-liberty", "Religious liberty", "I support religious freedom with narrow exemptions from general civil law.", "Belief, worship, and internal religious governance deserve robust protection. Exemptions from neutral laws should generally stop where they impose material burdens on employees, customers, patients, or other third parties."),
        ]
    },
    {
        id: "justice-drugs",
        title: "Justice & Drug Policy",
        beliefs: [
            belief("policing", "Policing", "I would move suitable public-safety work from armed police to civilian teams.", "Mental-health crises, traffic response, and some community services can often be handled by specialists who are not armed officers. Police should remain available for dangerous situations and operate under stronger use-of-force, reporting, camera, and independent-investigation standards."),
            belief("sentencing", "Criminal sentencing", "I support limited sentencing reform rather than ending every mandatory minimum.", "Minimum sentences should remain for selected violent, trafficking, and repeat offenses, with broader judicial safety valves. Rehabilitation, education, reentry support, and proportional individual review should be central parts of the system."),
            belief("drug-policy", "Drug policy", "I support legal cannabis and a health-led response to personal drug use.", "Personal possession of other drugs should be decriminalized while treatment, medication, harm reduction, and recovery services expand. Government should still prosecute trafficking that exploits people or causes substantial harm and should address public disorder."),
        ]
    },
    {
        id: "firearms",
        title: "Firearms",
        beliefs: [
            belief("firearm-purchases", "Purchasing firearms", "I support universal checks, purchase permits, training, waiting periods, and red-flag orders.", "Nearly all transfers should use a background check, and purchasers should demonstrate basic safe handling. Red-flag orders need prompt hearings, meaningful evidence standards, and consequences for abuse so temporary restrictions include due process."),
            belief("semiautomatic-rifles", "Semi-automatic rifles", "I would license and regulate semi-automatic rifles rather than ban named models.", "Enhanced training, safe-storage rules, licensing, and a higher purchase age address capability more consistently than feature-based labels. I do not currently support a general ban on commonly owned rifles or magazine capacities."),
            belief("public-carry", "Public carry", "I oppose routine carrying of loaded firearms in ordinary public life.", "Secured transport and limited use for hunting, sport, qualifying work, or a documented immediate threat should remain possible. A broad public-carry prohibition reflects my preferred policy direction, but it would require a change from current Supreme Court doctrine."),
        ]
    },
    {
        id: "immigration",
        title: "Immigration",
        beliefs: [
            belief("legal-immigration", "Legal immigration", "I support expanding immigration with more emphasis on skills and labor needs.", "The country should admit more people while giving greater weight to useful skills, language ability, and labor-market demand. Worker protections are necessary so visa status does not become a tool for exploitation or wage suppression."),
            belief("undocumented-residents", "Undocumented residents", "I support an earned path to citizenship for long-settled undocumented residents.", "Screened residents should be able to earn permanent status through time, taxes, and fees, with faster protection for childhood arrivals. Serious criminals and recent unlawful entrants should remain enforcement priorities."),
            belief("border-asylum", "Border and asylum", "I favor fast, humane adjudication with credible enforcement.", "More judges and asylum officers should decide claims quickly, supervised release should be used when safe, and rejected applicants should be removed promptly. Physical barriers, technology, and staffing should be used where each is demonstrably effective."),
        ]
    },
    {
        id: "technology",
        title: "Technology",
        beliefs: [
            belief("digital-privacy", "Government surveillance", "I favor a warrant-first standard for Americans' digital data.", "US-person searches, location histories, and information purchased from data brokers should generally require probable cause. Narrow emergency exceptions should be documented, audited, and followed by independent review."),
            belief("technology-platforms", "Large technology platforms", "I support national privacy rights, interoperability, transparency, and targeted antitrust enforcement.", "People should be able to access, correct, delete, and move their data and understand important algorithmic decisions. Interoperability can create security risks, so standards must prevent competition policy from becoming an easy route to private information."),
            belief("artificial-intelligence", "Artificial intelligence", "I support risk-based AI rules rather than one regime for every use.", "High-risk systems should face testing, documentation, accountability, and meaningful human appeal, while low-risk development remains broadly open. Requirements should scale with a system's actual capability and context so regulation does not freeze useful innovation."),
        ]
    },
    {
        id: "defense-trade",
        title: "Defense & Trade",
        beliefs: [
            belief("defense-spending", "Defense spending", "I support major military retrenchment.", "The United States should reduce overseas bases, force structure, and nuclear spending and focus on territorial defense and direct threats. This would give the country less capacity for simultaneous global operations and require allies to assume much more conventional defense."),
            belief("alliances-war-powers", "Alliances and war powers", "I would retain alliances while demanding burden sharing and congressional control of war.", "Collective-defense commitments can deter aggression, but allies should carry more of the material burden. Except for genuine emergencies, sustained hostilities should require specific authorization from Congress."),
            belief("trade-china", "Trade and China", "I support broad protectionism and substantial economic separation from China.", "Tariffs, local-content rules, and domestic investment should rebuild production and reduce dependence in strategic and ordinary supply chains. I accept that this can raise consumer and input prices and invite retaliation in exchange for greater domestic capacity."),
        ]
    },
    {
        id: "foreign-affairs",
        title: "Foreign Affairs",
        beliefs: [
            belief("ukraine", "Ukraine and Russia", "I support conditional aid to Ukraine alongside negotiations and European burden sharing.", "Defensive aid should be accountable and increasingly carried by Europe while Ukraine leads decisions about acceptable talks. The goal should combine resistance to conquest with a credible route away from indefinite war."),
            belief("israel-palestine", "Israel and Palestine", "I support a conditional two-state policy.", "US policy should support Israeli security and viable Palestinian statehood, oppose settlement expansion, exclude armed extremist rule, and condition military aid on humanitarian and legal standards. Both peoples' security and self-determination should constrain the means used to pursue them."),
            belief("foreign-aid", "Foreign assistance", "I support strong humanitarian aid and rights-conditioned security assistance.", "Health, food, disaster, and development programs can prevent suffering and instability. Military aid should face enforceable human-rights, end-use, and anti-corruption conditions rather than being treated as an unconditional entitlement."),
        ]
    },
    {
        id: "gender-speech",
        title: "Gender & Speech",
        beliefs: [
            belief("transition-care-minors", "Transition care for minors", "I would reserve medical transition treatment for adults.", "Minors should have access to supportive mental-health care, but puberty blockers, cross-sex hormones, and transition surgery should wait until adulthood. I recognize that this limits family and clinical discretion in an area where people disagree strongly about evidence and harm."),
            belief("sex-separated-settings", "Sports and sex-separated settings", "I support context-specific rules rather than one rule for every setting.", "Competitive categories after puberty should remain sex-based, with inclusive or open options where practical. Other settings should use privacy accommodations and individualized safety assessment instead of automatically applying an athletics rule everywhere."),
            belief("free-speech", "Freedom of speech", "I favor strong, viewpoint-neutral protection for controversial expression.", "Government should protect even offensive or false opinions while narrowly enforcing established rules against threats, fraud, defamation, incitement, and targeted harassment. Public institutions should not suppress a viewpoint by relabeling disagreement as safety."),
        ]
    },
    {
        id: "family",
        title: "Family Policy",
        beliefs: [
            belief("paid-leave-childcare", "Paid leave and childcare", "I support universal paid leave and broadly subsidized childcare.", "National benefits should protect income during family and medical leave and make quality childcare broadly affordable. Together with an additive UBI, this requires substantial new revenue and should not be described as costless."),
            belief("parental-authority", "Parental authority", "I favor parental direction with increasing autonomy for mature minors.", "Parents should make most education and healthcare decisions, while defined safeguards allow older minors confidential access to limited essential care. The boundary should account for maturity, urgency, welfare, and the consequences of disclosure."),
            belief("sex-education", "Sex education", "I support a required, comprehensive, medically accurate curriculum.", "Students should learn age-appropriate information about abstinence, contraception, consent, healthy relationships, orientation, and STI prevention. Parents should be able to review the curriculum, but I do not support individual opt-outs from the common public-health core."),
        ]
    },
    {
        id: "fiscal-policy",
        title: "Fiscal Policy",
        beliefs: [
            belief("deficits-debt", "Deficits and debt", "I favor gradual deficit reduction through revenue and restrained low-priority spending.", "Debt should decline relative to the economy over time without sacrificing productive investment or forcing austerity during recessions. My UBI, education, and family commitments mean progressive taxes, defense reductions, and other offsets would need to be substantial."),
            belief("social-security", "Social Security", "I support a mandatory transition toward regulated personal retirement accounts.", "Younger workers should place part of payroll contributions in individually owned accounts and receive correspondingly lower guaranteed benefits. This may improve ownership and returns, but it shifts market and timing risk from government to individuals and requires financing the transition."),
            belief("medicare", "Medicare", "I support premium support through capped federal contributions and competing plans.", "Beneficiaries should choose among qualifying public and private plans with a defined federal contribution. Competition may encourage cost sensitivity, but beneficiaries bear more risk if healthcare costs rise faster than the government's contribution."),
        ]
    },
    {
        id: "social-support",
        title: "Social Support",
        beliefs: [
            belief("disability-support", "Disability support", "I support adequate benefits, higher asset limits, and gradual earnings phaseouts.", "Disability policy should preserve healthcare, fund accommodations, and make work possible without a sudden loss of security. Eligibility should be understandable and reviewable without treating every recipient as able to work."),
            belief("homelessness", "Homelessness and public order", "I support enforcement after adequate services and treatment capacity exist.", "Government should first expand shelter, supportive housing, treatment, and appropriate institutional capacity. It may then enforce camping and public-drug laws with treatment alternatives, individualized decisions, and judicial review rather than criminalizing a lack of available help."),
            belief("veterans", "Veterans", "I support broad veteran choice between VA and private healthcare.", "Veterans should be able to use federal coverage with public or private providers, while specialized VA centers remain where they perform best. Choice can improve access, but systems must share records and avoid draining expertise from care unique to service-related conditions."),
        ]
    }
];

module.exports = { categories, reviewedDate: REVIEWED_DATE };
