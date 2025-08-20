---
title: "Homelab Adventures"
date: "2025-08-19"
tags: ["general", "homelab", "programming"]
---
<center><img src="/images/my-homelab.png" width="50%;" alt="A cartoon picture of my homelab"></center>

*"I kind of want my own server."* It's the one sentence that starts an all-consuming obsession that never starts growing.

For those of you without your own server that you're running in your house, you might not understand. You might not understand how such an Infection can take hold in your mind. It gnaws, it lingers, and it roots its way deep inside. The whole time your mind is screaming, objecting to how this worm can take hold of your entire thought process, and compell you to keep moving forward. And yet the whole time, you're welcoming it in.

Where do I even begin?

## Chapter 1 - The Beginnings
I don't remember how I initially picked up The Virus. I could have caught it when I was browsing internet forums. In my college days I was what you would call a *highly motivated* individual. This meant that I was constantly searching for ways to improve and learn. This inevitably led to me creating a [Discord bot](github.com/danielbarnes175/DanielBot) in my first year of college. Running it on my laptop was perfectly fine, but then people would only be able to use it when my laptop was running, so I needed a better way to host it. I needed a way that would give me 24/7 uptime.

<span style="text-decoration: line-through">So I bought some hardware, and hosted it on my server.</span>

I initially used an Amazon EC2 instance on the free tier, but I quickly ran out of the free trial, and I needed something else. So I found out about DigitalOcean, and subscribed to the cheapest $5/month droplet, and ran my code on there. It was honestly quite easy and effective, and to this day, I'll probably recommend DigitalOcean. I haven't used it for a few years, though, so I can only speak to what I know, which could be outdated.

DigitalOcean was great. I would make changes to my code, and then connect to the droplet through the web browser, manually stop my Discord bot, `git pull` down my changes, and start the bot again. I had no clue what CI/CD was at this stage in my knowledge. I was still learning what Object Oriented Programming was. And despite how solid DigitalOcean was for me, it did have one fatal flaw: **it cost money**.

And of course, in those days, Raspberry Pis were the talk of the town. They were everywhere. Somehow I had gotten the preconceived notion that buying your own hardware would save you money on hosting. Combine that with the fact that people constantly talked about the strange land of Linux (obviously my EC2 instance and DO Droplet were windows), it led to me strongly considering a Raspberry Pi as an option to my hosting woes.

So I scrounged up the $70 or so and purchased a Raspberry Pi 3. And so my self hosting journey began. My Discord Bot went back online, and I also started a Twitter bot. I even heard about this neat tool to block ads on all your devices called PiHole, so I set that up too. At some point, I even setup PM2 to automatically restart my different applications if they ran into an error (in particular on my school network, the connection to the Discord API would sometimes disconnect, and cause my bot to crash. Obviously I didn't have any retries on the bot itself).

Life was good. But at the same time, I had already gotten The Infection.

I had a chance to get out. After running this Raspberry Pi for some time, I had "fun" notions of starting my own business. Of course with that, I knew that I needed to be more serious about my process. No longer could I move locations (remember I was in college at the time), and just not set up my Raspberry Pi until I felt like it. I actually ran into the same problem that I originally ran into: I needed 24/7 (or close to it) uptime.

Thankfully at the time, I was naive, and The Infection hadn't yet taught me about failover hardware, a UPS, or any of the other countless ways that SREs ensure that the infrastructure of a company doesn't just fall apart. I went back to what I knew: DigitalOcean.

And by now, years had passed. I was close to graduating, so I had picked up proper skills. I knew how to create a CI/CD setup. I knew how to leverage Cloudflare and DNS records, and use DigitalOcean to scale up. But over time, these skills were for naught. I had learned a lot through the process, but the notion of starting my own business soon died, and with it, so did my server dreams when I finally shutdown my droplets once and for all. My website would go dark. My Discord Bot would sign out. And I would no longer have my own server.

And yet the itch remained.

## Chapter 2 - The Rabbit Hole Deepens
So without my server, I actually focused on developing my software skills. I graduated college, and started a new full time job. Things were good. I was learning a lot and becoming a better developer. A few years passed by, and the whole time, I still worked on personal projects. But I didn't have anywhere to put them. I was putting all this effort into creating the software (primarily web development), but I didn't have anything to show for it.

At the same time, I was becoming a lot more aware of the concept of data security, privacy, and just generally having less of a reliance on big tech companies. And then lastly, I wanted to strengthen one of my weak areas when it comes to IT: the hardware. I hadn't yet wanted to setup my own server, but eventually I stumbled upon the r/selfhosted and r/homelab subreddits, and from there, well, I very quickly realized the opportunities that were presented to me.

It seemed as if a whole sea of possibilities was there. There was a whole world of different softwares and programs that you could self host to make your life easier. I started out with Jellyfin, as many do, but I found quickly that it was a little annoying to need my desktop computer turned on when I wanted to watch videos. So that led me to a certain automation stack for downloading videos. And that led to me the idea that I needed my own hardware. I needed my own server to finally enter these limitless lands of data privacy and control. I would finally be able to control what I'm hosting, and not need to pay a subscription (<span style="text-decoration: line-through">if you don't consider electricity costs a subscription...</span>) for it. 

So I went on good ol' Amazon and purchased a BeeLink S12 Pro with 512GB of NVME storage, 16GB of RAM, and an N100 processor. That's right, I purchased a mini-pc. I think it came with Windows installed, although I'm not sure; I flashed Ubuntu Server onto it almost immediately. And then on top of that, I installed CasaOS. I know, I know, CasaOS is kind of a noob "OS", but I just wanted to hop into the fun of self hosting, and it made it very accessible.

I quickly setup that certain automation stack for Jellyfin, actually learned about how Docker works (At work, all the Docker stuff was managed by our platforms team, so it was abstracted away from me. I just ran a make command, but now I actually learned how to setup my own containers and understand/configure volumes). I swapped away from PiHole (which I didn't like the UI of) to a more simplistic, but just as powerful AdGuard Home.

I setup the big names like Immich for preserving photos long term, BookStack for an internal wiki, and SyncThing to use my desktop as a backup environment. I setup Crafty Controller for a minecraft server (or 3) to play with my friends. I even linked up Cloudflare Tunnels to allow for accessibility from a domain. These early days were fast. CasaOS makes it really easy to spin up different Docker containers, try out a service, and if you don't like it, you just remove it. And I did just that, and ran through so many different self hosted services.

Those early days were fun. I was hosting a minecraft server for my friends, and I wanted backups as part of that. I also had my Immich which I hoped to store photos in for many years as a sort of digital time capsule. So I purchased 2 USB hard drives, and setup SyncThing to sync my files to them. I also moved all of the Docker app data to be hosted on this, leaving the main drive on my actual Mini PC for the OS only. 

In hindsight, this was a huge waste. Data transfer speeds were too slow on the hard drives, which led to slowdowns on my Minecraft server when saving (thank you Spark profiler), and my Mini PC power output wasn't enough to support both hard drives plugged in at once. So while I had gotten both so one could be a primary drive and the other could be a failover, it ended up being just a primary, and the "failover" drive just sat on the side unplugged.

So I needed to upgrade my storage setup with a proper SSD. Thankfully, the Mini PC I purchased had an extra drive in it. I ordered a 4TB SSD, popped open my Mini PC, proceeded to completely tear the SATA cable, and sat for a bit in contemplation. One quick communication with BeeLink support, and a replacement SATA cable sent over, and I was back in action. I swapped in the SSD, did a "quick" file transfer, did some performance testing by playing Minecraft, and sat down with joy as I realized the days of slow file speeds, and my drive unmounting after a power outage were over.

## Chapter 3 - A Changing Point
This was the changing point for me and my server. From here, I lost my focus that I previously had. My ambitions were small at the beginning. I just wanted Jellyfin, Immich, Minecraft, and some other miscellaneous things. Now though, I was fully embedded in the wormhole of 3-2-1 backups, security, monitoring, scalability, and I even had the idea of setting up Kubernetes.

For the security and monitoring side, I setup auto-alerting / monitoring with UptimeKuma. I was learning and looking into how to pen-test my own server. Honestly from the security side, I got a little paranoid. Quickly though, I became satisfied with my security, and I moved onto how to upgrade my little lab.

Of course, it was just 1 Mini PC. It still is, mind you, but I have so many ideas. What if I wanted to host not just 1 (ram eating) Minecraft server, but multiple? What if I wanted the ability to scale out my containers to support higher load? What if I want to have high availability on my Jellyfin server in case something breaks? How should I fully create an actually working 3-2-1 backup solution? These are the questions that are constantly in my mind.

And the whole time I'm still finding new services and playing around with them. I'm still toying with different things, and breaking different parts that I then have to fix. This is the infection. My mind is constantly using this server as a way to learn so much about maintaining infrastructure. I'm trying to figure out how to move away from CasaOS, and create build scripts so when I purchase another machine, I don't need to do any manual setup. Or if my current machine needs to be setup again after a catastrophic failure, how can I automate it?

At work, during my review, I talked about how I'm doing all of this, and how it's making me a better developer. It's not even directly related to what I do for work, and yet, I still feel like it's expanding my skills that are directly related to work. At the very least, it's made me hungry to learn again. It's reignited the fire of wanting to just make cool things. That's the whole point of this whole website.

It's both scary and exciting how much this has turned into a little hobby for me. And my pace is actually pretty slow. There's still so much for me to actually learn and actually implement. It's still so fun though, every step of the way.

So while I may have been a little dramatic about how I talked about The Virus at the beginning of this post. I cannot deny that the server lives rent free inside my mind. And it's making me happy.
