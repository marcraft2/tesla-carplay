
## Installation guide for tesla navigator


We are going to create a Wifi networks from a Raspberry Pi and a 4G chip. Tesla will connect to this WiFi networks, and Carplay will be available through a website hosted on the Raspberry Pi in the tesla browser. And the sound will go through bluetooth.


Requirement
------
 - At least a Raspberry Pi zero W seems to be sufficient
 - Micro SD Card
 - 4G USB Key (test with Huawei E3372) or 4G/5G router (NetGear Nighthawk can be easily routed to run iptables commands)
 - SIM card with 4G
 - Carlinkit (test with CPC200 2.0)
 - USB keyboard
 - Ethernet with internet
 - USB cables

*(It is also possible to replace the 4G adapter and the sim card, by a telephone connection sharing. This tutorial is not that solution at the moment. And wireless carplay does not allow Wi-Fi connection sharing to be used at the same time.)*


OS Installation | Raspberry Pi OS (Debian based)
------

Insert the Micro SD Card into your computer.


First download [Raspberry Pi OS Downloader](https://www.raspberrypi.com/software/), install and run it.



For OS select => `Raspberry Pi OS Other` => `Raspberry Pi OS Lite (64-bit)`

Select your memory card and click `Write`

Prepare your 4G dongle on another device, setting up the pin code is all it takes to get the 4G dongle ready to work.


You can now insert your Micro SD Card in your Raspberry Pi, connect a keyboard, ethernet cable, 4G Dongle as well as a screen. Then the power cable. Wait while Debian starts up.

- user : `pi`
- password : `raspberry`


You are now connected to a command terminal, with that we will be able to control your Raspberry Pi.

Warning: the keyboard is a QWERTY on startup!

First, we will make all the updates available. (Typing is command followed by entering)

```
sudo apt install update
sudo apt install upgrade -y
```

Config raspi os :
```
raspi-config
```
use `pi` like default

- Select `Localisation Options` => `Locale` => Select the right option
- Select `Localisation Options` => `Timezone` => Select the right option
- Select `Localisation Options` => `Keyboard` => Select the right option
- Select `Localisation Options` => `WLAN Country` => Select the right option


Enable SSH
------
We will define a password for our user `root`, Use `root` as the password. (user: `root`, password: `root`)

```
sudo passwd root
```
It is normal that nothing is displayed when you type your password. You just have to press Enter when you have finished typing it.

Change user to root
```
su - root
```
password : `root`


We configure SSH. For that we will use the `nano` text editor :
```
nano /etc/ssh/sshd_config
```

Find the line that contains `PermitRootLogin`, you can move around with the arrows on your keyboard.
Remove `#` in front of `PermitRootLogin`, and set it to `yes` :
```
PermitRootLogin yes
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`

Restart the ssh service to apply the changes.
```
systemctl restart sshd
```

SSH Connection
------

Look at the ip address of your `eth0` (or something like `enp0s3`) ethernet interface :
```
ip a
```
It should look like 192.168.X.X or 10.X.X.X on this interface

At home I received this ip address 192.168.1.68, yours will certainly be different.

We will now be able to leave the Raspberry Pi aside, and access it remotely using ssh. This will make it easier for us to copy paste.

For this on windows [download Putty](https://www.putty.org/) software and install it. Open Putty, in `Host Name (or IP address)` set your ip (me it's 192.168.1.68) (Port: `22`, Connection type: `SSH`) and click `Open` to open the ssh connection.

On linux/macOS you can open the terminal application then type the following command:
```
ssh root@192.168.X.X
```

Enter username and password (user: `root`, password: `root`)

You should now be connected to a terminal of your Raspberry Pi.


Now check that your 4g key is detected, for this
```
ip a
```
You should see an ip address for the eth1 interface. If this is not the case, check that your 4G key is functional on another device.



Rename Raspberry Pi | Change hostname
------

We configure the hostname :

```
echo 'carplay' > /etc/hostname
```

To apply the change you must restart the Raspberry Pi :

```
reboot
```
(You will need to reopen your ssh connection when the system will be started)


Creation of the Wi-Fi network | hostapd
------

At first we will create the wifi networks with the wifi antenna integrated in the Raspberry Pi.

We configure the wifi interface. For that we will use the `nano` text editor :

```
nano /etc/network/interfaces.d/wlan0
```

Add this below the comment :
```
auto wlan0
iface wlan0 inet static
    address 192.168.0.254/24
#    up iptables-restore < /etc/iptables.save
#    up systemctl restart udhcpd
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`


We apply the configuration:
```
systemctl restart networking
```
(You may need to reopen your ssh connection after that)



Now we should see the ip address `192.168.0.254` on `wlan0` with this command:

```
ip a
```

We install the software  `hostapd` that will allow us to create a Wifi networks:
```
apt install hostapd -y
```

We are now going to configure the hotspot by editing this file `/etc/hostapd/hostapd.conf`

For that we will use the `nano` text editor :

```
nano /etc/hostapd/hostapd.conf
```

You are going to replace all the contents of the file with this :
```
interface=wlan0
hw_mode=g
channel=3
country_code=FR
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
ssid=Tesla
wpa_passphrase=amazingpassword
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`

We restart the software for the new configuration under apply with :

```
systemctl unmask hostapd
systemctl enable hostapd
systemctl restart hostapd
```

Your wifi network are ready, you should see it in the list of your wifi network on your pc or smartphone. However, this network does not have internet access at the moment.


Create DHCP Server | udhcpd
------

```
apt install udhcpd -y
```

We are now going to configure the dhcp by editing this file `/etc/udhcpd.conf`

First move old and we will use the `nano` text editor :

```
mv /etc/udhcpd.conf /etc/udhcpd.conf.old
nano /etc/udhcpd.conf
```

You are going to paste this :
```
start 192.168.0.20
end 192.168.0.50
interface wlan0
remaining yes
opt dns 8.8.8.8 8.8.4.4
option subnet 255.255.255.0
opt router 192.168.0.254
option lease 864000
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`

We also need to edit the following file to apply the configuration.
```
nano /etc/default/udhcpd
```

Replace `DHCPD_ENABLED="no"` by this :
```
DHCPD_ENABLED="yes"
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`


We restart the software for the new configuration under apply with :

```
systemctl enable udhcpd
systemctl restart udhcpd
```

Rooting & bypass tesla local ip blocking | iptable
------

```
apt install iptables -y
```

Enabled routing

```
nano /etc/sysctl.conf
```

Replace `#net.ipv4.ip_forward=1` by this (remove the # in front of the line):
```
net.ipv4.ip_forward=1
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`

Add iptables rule


```
nano /etc/iptables.save
```
You are going to paste this :

```
# Generated by iptables-save v1.8.7 on Tue Nov 16 23:51:53 2021
*filter
:INPUT ACCEPT [2658:613944]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [2815:238140]
-A FORWARD -i eth1 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT
-A FORWARD -i wlan0 -o eth1 -j ACCEPT
COMMIT
# Completed on Tue Nov 16 23:51:53 2021
# Generated by iptables-save v1.8.7 on Tue Nov 16 23:51:53 2021
*nat
:PREROUTING ACCEPT [566:93327]
:INPUT ACCEPT [141:10290]
:OUTPUT ACCEPT [1105:91323]
:POSTROUTING ACCEPT [7:331]
-A PREROUTING -d 240.3.3.4/32 -i wlan0 -p tcp -m tcp --dport 80 -j DNAT --to-destination 192.168.0.254
-A PREROUTING -d 240.3.3.4/32 -i wlan0 -p udp -m udp --dport 80 -j DNAT --to-destination 192.168.0.254
-A PREROUTING -d 240.3.3.4/32 -i wlan0 -p tcp -m tcp --dport 443 -j DNAT --to-destination 192.168.0.254
-A PREROUTING -d 240.3.3.4/32 -i wlan0 -p udp -m udp --dport 443 -j DNAT --to-destination 192.168.0.254
-A POSTROUTING -o eth1 -j MASQUERADE
-A POSTROUTING -s 192.168.0.254/32 -p tcp -m tcp --dport 80 -j SNAT --to-source 240.3.3.4
-A POSTROUTING -s 192.168.0.254/32 -p udp -m udp --dport 80 -j SNAT --to-source 240.3.3.4
-A POSTROUTING -s 192.168.0.254/32 -p tcp -m tcp --dport 443 -j SNAT --to-source 240.3.3.4
-A POSTROUTING -s 192.168.0.254/32 -p udp -m udp --dport 443 -j SNAT --to-source 240.3.3.4
COMMIT
# Completed on Tue Nov 16 23:51:53 2021
```

We will be able to activate it is the rule at startup.

```
nano /etc/network/interfaces.d/wlan0
```

And remove the # in front of the line `up iptables-restore < /etc/iptables.save` and `up systemctl restart udhcpd`


Your file should look like this :
```
auto wlan0
iface wlan0 inet static
    address 192.168.0.254/24
    up iptables-restore < /etc/iptables.save
    up systemctl restart udhcpd
```



Create Web Server for tesla-carplay | nginx
------

For this step you need a trusted certificate and its key.
Why? because you need VideoDecoder object which require a secure context to be available on Chrome. This allow the browser to be able to render h264 using either canvas2d, webgl or webgl2. And then it works when you drive too.

So we need a domain name, for that we go to the [freenom](https://www.freenom.com/) site, which provides free domain names.
Create an account and reserve the domain name you like for free. I chose `carplay.ml` for my installation. Check that the domain is available in the list of your domains on the site after the order. (You must be logged in to see the availability of domains, without it they will all be marked unavailable)

Now we will generate an HTTPS (SSL) certificate for this we will use cerbot. It is a tool to generate a certificate with let's encrypt, which signs your certificate via a challenge on the DNS of your domain name. If the challenge is successful, let's encrypt delivers the certificates to you. To validate this challenge we will allow cerbot to access our frenom account so that it can automatically do the DNS challenge.

We will use the `nano` text editor :

```
nano /var/credentials.ini
```
You are going to paste this :
```
dns_freenom_username = username
dns_freenom_password = password
```
Replace username and password with our email address and your freenom password
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`



Now we will install nginx, certbot, and the freenom plugins for cerbot :
```
apt install python3-pip nginx -y
pip3 install certbot certbot-dns-freenom
```

Now we start the automatic generation of certificates (replace the email address, by your email address, and the domain by your domain) :
```
certbot certonly -a dns-freenom \
  --dns-freenom-credentials /var/credentials.ini \
  --dns-freenom-propagation-seconds 600 \
  -d "carplay.ml" \
  -m yourmail@domain.tld \
  --agree-tos -n
```
It's long... (600 seconds = 10 minutes)


If all goes well you should see this :
```
root@carplay:~# certbot certonly -a dns-freenom \
  --dns-freenom-credentials /var/credentials.ini \
  --dns-freenom-propagation-seconds 600 \
  -d "carplay.ml" \
  -m xxxxxx@gmail.com \
  --agree-tos -n
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Account registered.
Requesting a certificate for carplay.ml
Unsafe permissions on credentials configuration file: /var/credentials.ini
doLogin: Login successfully.
setRecord: Record added successfully
Waiting 600 seconds for DNS changes to propagate
delRecord: Record deleted successfully

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/carplay.ml/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/carplay.ml/privkey.pem
This certificate expires on 2022-12-17.
These files will be updated when the certificate renews.

NEXT STEPS:
- The certificate will need to be renewed before it expires. Certbot can automatically renew the certificate in the background, but you may need to take steps to enable that functionality. See https://certbot.org/renewal-setup for instructions.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
If you like Certbot, please consider supporting our work by:
 * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
 * Donating to EFF:                    https://eff.org/donate-le
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

As we can see, it creates our fullchain and our privkey
```
root@carplay:~# ls /etc/letsencrypt/live/carplay.ml/
cert.pem  chain.pem  fullchain.pem  privkey.pem  README
```

The certificate must be updated, for this we add a task at startup thanks to cron, for this:
```
crontab -e
```
Press `1` for nano selection if prompted.

And paste this after the comments:
```
@reboot while ! ping -c 1 -n -w 1 8.8.8.8 > /dev/null ; do true; done && certbot renew -q
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`
Now at each start the certificate will be updated if necessary as soon as the internet connection is accessible.


We are now going to configure the nginx web server by editing this file `/etc/nginx/conf.d/carplay.conf`

We will use the `nano` text editor :

```
nano /etc/nginx/conf.d/carplay.conf
```

You are going to paste this (replacing `carplay.ml` with your domain):
```
server {
  listen 80;
  server_name carplay.ml;
  return 301 https://carplay.ml;
}

server {
    server_name carplay.ml;
    ssl_certificate /etc/letsencrypt/live/carplay.ml/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/carplay.ml/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/carplay.ml/chain.pem;
    listen 443 ssl;
    location / {
     root /var/www/carplay;
     index index.html;
    }
    location /ws/ {
      include proxy_params;
      proxy_pass http://127.0.0.1:8080/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_read_timeout 86400;
    }
}
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`

We restart the software for the new configuration under apply with :
```
systemctl enable nginx
systemctl restart nginx
```

You must now point the domain you created to the IP address

To do this, go to your freenom account, create an A record at the root of your account so that your domain points to the IP.
For thats `Services` => `Domaines` => `Manage Domain` => `Manage Freenom DNS` => Leave Name empty, type: `A`, target: `240.3.3.4` => `Save Change`.

We can check your domain with dig :
```
root@carplay:~# apt install dnsutils -y
root@carplay:~# dig carplay.ml +short
240.3.3.4
```
(it may be necessary to wait for the record to spread)


Bluetooth connection | bluez-alsa
------

```
apt install bluez bluez-tools git libglib2.0-dev libasound2-dev build-essential autoconf libbluetooth-dev libtool libsbc-dev libdbus-1-dev libspandsp-dev ffmpeg -y
cd && git clone https://github.com/Arkq/bluez-alsa.git
cd bluez-alsa
mkdir -p m4
autoreconf --install
mkdir build && cd build
../configure CFLAGS="-g -O0" LDFLAGS="-g" --enable-debug
make && sudo make install
adduser root bluetooth
adduser root audio
```


You can startup bluealsa by it to `/etc/rc.local`:

```
nano /etc/rc.local
```

Now add this before the exit line :
```
export LIBASOUND_THREAD_SAFE=0
/usr/bin/bluealsa -S &
```


There is a `a2dp` plugin for our bluetooth agent. So we'll change the services' `ExecStart` parameter like so:
```
nano /etc/systemd/system/bluetooth.target.wants/bluetooth.service
```

And while we're here we'll disable sap since this may cause some errors:

```
ExecStart=/usr/libexec/bluetooth/bluetoothd --noplugin=sap --plugin=a2dp,avrcp
```

Rename raspberry pi bluetooth name:  
```
nano /etc/bluetooth/main.conf
```
Remove `#` in front of `Name` (line 5), and set it to whatever you want, I'll use `Carplay` :

```
[...]
Name = CarPlay
[...]
```


Now reload and restart the agent:
```
systemctl daemon-reload
systemctl restart bluetooth
```


Now we will connect the bluetooth
This operation must be carried out in the tesla, you can power your raspberry on the usb port of your tesla.


Enter bluetooth configuration mode :
```
bluetoothctl
```

Now run
```
power on
agent on
default-agent
scan on
discoverable on
```

Go to your tesla in the bluetooth settings, to add a new device. Then select your raspberry, me it's called `CarPlay`

Answer us `yes` all the questions you ask the raspberry


The `trust` command will enable to auto-pair the device again later on. (replace the Bluetooth MAC address with that of your Tesla, it should be displayed when you have accepted the connection with `yes`)
```
trust AA:BB:CC:DD:EE:FF
exit
```

Now create this file `/etc/asound.conf` to set the tesla as the default audio device on the alsa audio controller. (replace the Bluetooth MAC address with that of your Tesla, it should be displayed when you have accepted the connection with `yes`)
```
pcm.!default {
 type plug
 slave {
     pcm {
         type bluealsa
         device AA:BB:CC:DD:EE:FF
         profile "a2dp"
     }
 }
 hint {
     show on
     description "Tesla"
 }
}
```

Setup on reboot, for this edit `/etc/environment`

```
SDL_AUDIODRIVER="alsa"
```

And apply this command :
```
alsactl init
```
(Do not pay attention to the message that it returns to you, it is very often an error for another interface)

Now reboot
```
reboot
```

Reconnect bluetooth from your tesla screen after restarting and we will now test the bluetooth:

```
wget http://cd.textfiles.com/10000soundssongs/WAV/BANJO.WAV
ffplay -nodisp -vn -autoexit -i BANJO.WAV
```
This is the music of victory.

You can either play with the auto connection in your tesla settings, or you can do this if that's not enough:


Create Node Carplay Server | tesla-carplay
------
```
apt install git libudev-dev ffmpeg -y
curl -fsSL https://deb.nodesource.com/setup_17.x | bash -
apt-get install -y nodejs
npm install -g npm@latest
npm i -g pm2
cd /root/
git clone https://github.com/marcraft2/tesla-carplay.git
cd tesla-carplay
mkdir /var/www/carplay/
cp static/* /var/www/carplay/
npm i
pm2 start index.js
pm2 startup
pm2 save
```

For check log
```
pm2 logs
```

If you open Carplay in a browser on a computer, you must simulate a touch screen, otherwise you cannot control Carplay.


Enjoy
------

- Reboot your raspberry so that everything starts correctly
- Connect your Tesla to the bluetooth of the raspberry from the bluetooth settings of the tesla
- Connect your Tesla to your Raspberry Wi-Fi
- Plug in your iPhone (If wireless carplay is not already synced)
- Open your browser on your domain (me is `carplay.ml`)
- Enjoy

If a step of this tutorial does not work for you, do not hesitate to [open an issue](https://github.com/marcraft2/tesla-carplay/issues/new/choose), it will be with pleasure that I will answer you.

It was not easy, congratulations if it works, if you see bugs, or if you want to help the project, or if you simply have questions, it is with great pleasure.


About Tesla Security
------
 - You cannot connect with your tesla to a Wi-Fi network that does not have internet access. We therefore need 3G/4G internet access.
 - SSL certificate needs to be a real one because Tesla Browser doesn't allow insecure certificate (no way to validate exceptions)
 - Tesla's browser blocks access to the website which is located on a private IP address (192.168.X.X, 10.X.X.X, 172.X.X.X). We can bypass this security with IPTABLES
 - 240.3.3.X are non-routed public IP range (it can be used on internet)

 ```
 iptables -t nat -A PREROUTING -d 240.3.3.4 -i wlan0 -p tcp --dport 80 -j DNAT --to-destination 192.168.0.254
 iptables -t nat -A PREROUTING -d 240.3.3.4 -i wlan0 -p udp --dport 80 -j DNAT --to-destination 192.168.0.254
 iptables -t nat -A PREROUTING -d 240.3.3.4 -i wlan0 -p tcp --dport 443 -j DNAT --to-destination 192.168.0.254
 iptables -t nat -A PREROUTING -d 240.3.3.4 -i wlan0 -p udp --dport 443 -j DNAT --to-destination 192.168.0.254
 iptables -t nat -A POSTROUTING -s 192.168.0.254 -p tcp --dport 80 -j SNAT --to-source 240.3.3.4
 iptables -t nat -A POSTROUTING -s 192.168.0.254 -p udp --dport 80 -j SNAT --to-source 240.3.3.4
 iptables -t nat -A POSTROUTING -s 192.168.0.254 -p tcp --dport 443 -j SNAT --to-source 240.3.3.4
 iptables -t nat -A POSTROUTING -s 192.168.0.254 -p udp --dport 443 -j SNAT --to-source 240.3.3.4
 ```
