# Circle Nurture — Confirmed Feature List

*Confirmed by the user 2026-08-12, verbatim. This is the contract the master spec decomposes into work items (step 11 gate passed). The MVP done-condition (decision C5) is unchanged: "the app opens on my phone and I can add people, jot a memory, and send a blast message."*

---

# Circle Nurture

## MVP Features & Capabilities

The Circle Nurture MVP should establish the foundation for a mobile-first relationship management and communication platform without turning relationship management into administrative work.

The experience should remain **private, human, quick, intuitive, and action-oriented.**

The MVP is intended to demonstrate a simple but important relationship loop:

> **Bring in my people → organize them → remember what matters → communicate → create the next connection → continue the relationship.**

---

# Original Core Features

## 1. Your People, in One Private Place

Add the people who matter across the different circles of a user's life, including family, friends, coworkers, former coworkers, mentors, professional contacts, people met while networking, organizational relationships, college friends, community relationships, and others.

Adding someone should never feel like completing a CRM record.

At its simplest, the user should be able to start with a name and whatever small amount of information they want to remember.

Additional information can accumulate naturally as the relationship continues.

### MVP Principle

**Capture first. Enrich later.**

Do not make extensive data entry a prerequisite for adding someone.

---

# 2. Circles

Users can organize people into Circles representing the different parts of their lives.

Examples:

* Family
* Close Friends
* College Friends
* High School Friends
* Former Coworkers
* Work
* Mentors
* Professional Network
* Book Club
* Alumni
* Professional Organizations
* Conference Contacts
* User-created Circles

A person can belong to multiple Circles.

For example:

**Angela Smith**

* Women in Leadership
* CFO Network
* Friends

Circles are primarily an organizational and communication structure.

**A Circle does not automatically mean a group chat.**

That distinction is fundamental to Circle Nurture.

---

# 3. Memories, Jotted Down

Users can quickly save small things they want to remember about someone.

Examples:

* "Got the promotion."
* "Loves sourdough."
* "Kids are 4 and 6."
* "Mother has surgery next month."
* "Interested in AI applications in finance."
* "Planning a trip to Italy."
* "We talked about her starting her own business."

Memories should be quick to capture and easy to retrieve.

The user should not feel obligated to document every interaction.

The purpose is simply:

> **I don't want to forget this.**

---

# 4. A Calm Home Screen

The Circle Nurture home screen should provide an immediate view of the user's people and Circles.

It should feel **human rather than analytical**.

Avoid creating a traditional CRM dashboard filled with:

* charts
* performance indicators
* scores
* overdue tasks
* excessive notifications
* relationship rankings

The home experience should help users quickly answer:

**Who are my people?**

**What do I want to do?**

**Who or what should I remember?**

---

# 5. Message One Person

From a person's Circle Nurture profile, the user should be able to quickly initiate communication.

For SMS/text communication, the desired experience is that the phone's messaging capability opens with the intended recipient and the user communicates from their normal identity/number where technically permitted.

Circle Nurture should reduce the steps between:

**Thinking about someone → communicating with them.**

---

# 6. Blast a Message Privately

This is a major Circle Nurture communication capability.

The user writes one communication and selects:

* multiple individual people
* an entire Circle
* or potentially people across multiple Circles

Each recipient receives an **individual one-to-one communication**.

This is **not a group text**.

Recipients should not see the other recipients.

Replies should remain private between the sender and each recipient.

The intended experience is:

> **Write once → choose my people → maintain individual communication lines.**

### Example

A user wants to tell 12 people:

**"I got the position! I wanted you to hear it directly from me."**

The user should not have to:

* create an unwanted group chat
* copy and paste the message 12 times
* individually recreate essentially the same communication
* post the news publicly

Circle Nurture provides a fourth option:

**One message. Twelve people. Twelve private conversations.**

Technical implementation must account for iOS/Android messaging limitations and applicable A2P requirements.

---

# 7. A Gentle Nudge, Never Homework

Circle Nurture can quietly surface when it has been a while since the user meaningfully connected with someone important.

The experience should never create guilt or turn relationships into obligations.

No relationship scores.

No:

**"You failed to contact Angela."**

Instead:

**"It's been a little while since you and Angela connected."**

The user determines whether action is appropriate.

This establishes the foundation for the future **Nurture Rhythm** capability without requiring sophisticated relationship intelligence in the MVP.

---

# 8. The Right Words When You Want Them — TrueTone

TrueTone provides optional communication assistance.

The user explains what they actually want to communicate.

TrueTone provides several possible expressions while attempting to preserve:

* the user's meaning
* intended tone
* relationship context
* user's voice

The user must review and approve the exact communication before it is sent.

TrueTone should never independently communicate with someone's contacts.

The philosophy is:

> **Help me express what I mean. Don't manufacture the relationship for me.**

---

# 9. The Story of Your Year

Circle Nurture should eventually allow users to look back at the relationships, interactions, memories, reconnections, and meaningful moments they accumulated.

This is intended to become an emotional and potentially share-worthy Circle Nurture experience.

Examples might include:

* People who entered your Circle
* Relationships maintained
* Relationships rekindled
* Meetings and get-togethers
* Important moments
* Memories captured
* Celebrations
* Photos
* Milestones

The purpose is not to measure popularity.

It is to help users see:

> **The people and connections that made up my year.**

The MVP should begin capturing the underlying data necessary for this future experience even if the complete annual storytelling experience is not built in the first release.

---

# Additional MVP Features & Capabilities

The following capabilities should be incorporated into the MVP because they strengthen the core Circle Nurture experience and establish the foundation for future features.

---

# 10. Bring My People

## Existing Contact Import + Circle Setup

When someone first installs Circle Nurture, they should not be required to manually recreate the people already stored on their phone.

Circle Nurture should allow users to select existing contacts and **bring those people into Circle Nurture intentionally**.

The application should not automatically dump the user's entire address book into Circle Nurture.

Instead:

> **Who belongs in your Circle Nurture?**

The user selects the people they want.

They can then assign those people to one or multiple Circles.

### Bulk Circle Assignment

The user should be able to select multiple people and assign them to a Circle simultaneously.

Example:

Select 18 people → **Add to Family**

Then select five of those same people → **Also Add to Inner Circle**

This prevents onboarding from becoming a data-entry project.

### Why This Matters

This establishes the user's relationship ecosystem immediately and creates the foundation for:

* Blast
* Memories
* TrueTone
* Next Connect
* Nurture Rhythm
* future relationship intelligence
* Story of Your Year

### Onboarding Principle

Do not require users to organize their entire life on Day 1.

A better experience may be:

> **Start with one Circle.**

Create or select the Circle.

Choose some people.

Start using Circle Nurture.

Additional Circles can develop naturally.

---

# 11. Add a New Connection

## Contact-In, Regardless of How the Contact Arrived

Circle Nurture should recognize that users already receive contact information through many mechanisms.

Someone may:

* share their phone contact
* use a QR code
* use a digital business card
* send a vCard
* share information phone-to-phone
* text their information
* provide a physical business card
* be manually entered into the phone

Circle Nurture should **not require that the contact originate inside Circle Nurture.**

The MVP goal is interoperability.

Once the person's contact information is available to the user/device, Circle Nurture should make it easy to:

> **Add this person to Circle Nurture.**

### Important MVP Scope Decision

Circle Nurture does **not** need to recreate every existing contact-exchange technology in the MVP.

We do not need to build another digital business card or proprietary QR networking ecosystem merely because those technologies exist.

Circle Nurture should instead become excellent at **what happens after contact information is exchanged.**

---

# 12. Our Connection

## Relationship Context

"Relationship Context" is the technical concept.

The working consumer-facing feature name is:

### **Our Connection**

This section answers:

> **How do I know this person, and what connects us?**

Potential fields include:

**How we met**
Women's Leadership Conference

**When we met**
August 12, 2026

**Where we met**
Washington, DC

**What connected us**
Conversation about AI adoption in finance

**Organization/Company**
XYZ Corporation

**Remember**
Angela's daughter is starting college this fall.

**Circles**
Women in Leadership · CFO Network

### Why This Is Different From Memories

**Our Connection** provides foundational context about the relationship.

**Memories** accumulate as things happen within the relationship.

This distinction should be maintained in the data model.

### Why It Matters

Months or years later, Circle Nurture should help answer:

**Who is Angela?**

**Where did I meet her?**

**Why did we connect?**

**What did we talk about?**

**Why did I want to stay in touch?**

That is considerably more useful than simply storing Angela's phone number and company.

---

# 13. Date We Met

## Relationship Chronology

For newly created relationships, Circle Nurture should capture the **Date We Met**.

When someone is added as a new connection, this can default automatically to the current date.

The user should be able to:

* accept the date
* change the date
* remove it
* leave it unknown

It should not be required for historical relationships where the user does not know the date.

### Example

Angela is added on August 12, 2026.

Circle Nurture automatically records:

**Met August 12, 2026**

Years later, Circle Nurture could say:

> **Angela has been in your Circle for 3 years.**

Or:

> **Three years ago this month, you met Angela at the Women's Leadership Conference.**

### Why It Matters

Humans frequently forget relationship chronology.

Over time this data can help answer:

* When did I meet this person?
* Who did I know first?
* Who entered my life this year?
* Did I know this person when I worked at a particular company?
* Who did I meet at that conference?
* How long have we known each other?

This is a simple data point with significant future storytelling and relationship-intelligence value.

---

# 14. Next Connect

## Don't Leave With a Contact. Leave With the Next Connection.

**Next Connect** is the working feature name for scheduling the next interaction with someone.

This should be particularly prominent when a user adds a new connection.

The networking principle is:

> **When possible, don't leave a meaningful new connection without the next interaction scheduled.**

After adding someone, Circle Nurture can ask:

### What's your Next Connect?

* Coffee
* Lunch
* Call
* Meeting
* Dinner
* Activity
* Visit
* Other
* Not Yet

### Networking Scenario

A user meets Angela at a conference.

They exchange contact information.

Rather than saying:

**"We should definitely get coffee sometime."**

and walking away, the user brings Angela into Circle Nurture.

Circle Nurture asks:

**What's your Next Connect?**

The user selects:

**Coffee**

They check availability together and schedule it.

Now the interaction ends with:

**Angela added.
Context remembered.
Coffee scheduled.**

The relationship has already moved beyond exchanging contact information.

### Why This Matters

Most networking tools are optimized around:

**Capture the contact.**

Circle Nurture should be optimized around:

**Continue the connection.**

That is an important product distinction.

---

# 15. Calendar Connection

## Make Next Connect Actionable

Next Connect requires lightweight calendar capability.

The MVP should investigate integration with the user's calendar ecosystem so the user can schedule a next interaction without creating unnecessary friction.

The initial requirement should remain intentionally narrow.

The MVP does **not** need to recreate Calendly or become a sophisticated scheduling platform.

The desired behavior is:

> **See availability → select a time → create the Next Connect → associate it with the person → place it on the calendar.**

Calendar architecture should account for the major mobile ecosystems and commonly used calendars.

More sophisticated scheduling functionality can be introduced later.

---

# 16. What's Next?

## Turn an Interaction Into an Action

After adding a person or completing an interaction, Circle Nurture can provide a lightweight prompt:

### What's Next?

Potential actions:

**Send a Message**

**Next Connect**

**Add a Memory**

**Nothing Yet**

This should not become another task-management system.

It is simply a bridge between:

**I met/interacted with this person**

and

**What, if anything, do I want to happen next?**

### Example

The user adds Angela.

Rather than landing on a static contact page, Circle Nurture asks:

**What's Next?**

The user selects:

**Next Connect → Coffee**

That action can immediately lead into scheduling.

---

# 17. After-Connection Memory

## Capture What Matters While It Is Fresh

After a scheduled interaction such as coffee, lunch, a call, or a meeting, Circle Nurture can offer a small optional prompt:

> **Anything worth remembering?**

The user might record:

**"Angela is considering joining a nonprofit board."**

or:

**"Send her the article about AI governance."**

or simply:

**"Great conversation. Introduce her to Michelle."**

### Why It Matters

This creates continuity between interactions.

Instead of memories being a feature users must remember to maintain, Circle Nurture provides an appropriate opportunity to capture context while it is fresh.

This creates the loop:

> **Connect → Remember → Next Connect.**

---

# 18. Last Connected

## Simple Relationship Awareness

Circle Nurture should maintain a simple record of when the user last meaningfully connected with someone.

This should remain factual.

It is not a relationship score.

Example:

**Last Connected: July 23**

This data becomes part of the foundation for the gentle nudge capability and eventually Nurture Rhythm.

### Why Capture It in the MVP?

Even if sophisticated relationship intelligence is not built initially, beginning to capture this information now prevents Circle Nurture from needing to reconstruct relationship history later.

---

# 19. Context at the Moment of Connection

## Remember Before You Reach Out

Saved information becomes substantially more useful when it appears at the moment the user needs it.

Before messaging, calling, or meeting someone, Circle Nurture can surface a small amount of relevant context.

Example:

### Angela

**Last connected:** Coffee, June 18
**Remember:** Daughter starting Howard this fall
**Last memory:** Considering joining a nonprofit board
**Next Connect:** Lunch today, 12:30 PM

The purpose is not to overwhelm the user with a dossier.

It is to provide the one or two pieces of context that help the user walk into the interaction remembering the human being.

### Why This Matters

This turns Circle Nurture from a place where information is merely **stored** into a place where relationship context becomes **useful**.

---

# The New-Connection Workflow

The MVP should be designed around a particularly strong workflow for new relationships:

## RECEIVE

Contact information enters the user's phone or Circle Nurture ecosystem through whatever method was used.

↓

## CAPTURE

Bring the person into Circle Nurture quickly.

↓

## PLACE

Assign the person to one or multiple Circles.

↓

## REMEMBER

Capture **Our Connection**:

When we met.
Where we met.
How we connected.
What I want to remember.

↓

## NEXT CONNECT

Determine whether there should be another interaction.

Coffee.
Lunch.
Call.
Meeting.
Something else.

↓

## SCHEDULE

When appropriate, put the Next Connect on the calendar while the relationship is still warm.

---

# The Larger MVP Relationship Loop

Across both existing and new relationships, the Circle Nurture MVP should establish:

> **PEOPLE → CIRCLES → REMEMBER → COMMUNICATE → NEXT CONNECT → CONNECT → REMEMBER AGAIN**

The application should become progressively more useful because relationship context accumulates naturally through actual human interaction.

---

# Two Important MVP Behaviors to Protect

Although the MVP contains multiple capabilities, two actions are particularly important because they differentiate Circle Nurture from a traditional contact manager.

## Private Blast

> **Communicate with several people individually without creating a group conversation.**

and

## Next Connect

> **Turn "we should get together" into an actual next interaction.**

Circles and relationship context make those actions more intelligent.

Memories make them increasingly valuable over time.

TrueTone can make communication more thoughtful.

Nurture Rhythm can eventually make relationship awareness more intelligent.

The Story of Your Year can ultimately make the accumulated relationship history emotionally meaningful.

---

# MVP Product Principle

Circle Nurture should be **agnostic about how a person enters the user's life and exceptional at what happens after they do.**

The product should not merely help users collect contacts.

It should help users turn contacts into continuing relationships.

The behavioral idea behind the networking experience can be summarized as:

> **Don't leave with a contact. Leave with a Next Connect.**

And the broader Circle Nurture promise remains:

> **Your people. Your circles. One place to remember, communicate, and stay connected.**
