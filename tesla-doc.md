
## Installation guide for tesla navigator


We are going to create a Wifi networks from a Raspberry Pi and a 4G chip. Tesla will connect to this WiFi networks, and Carplay will be available through a website hosted on the Raspberry Pi in the tesla browser. And the sound will go through bluetooth.


Requirement
------
 - Raspberry Pi 4 Modèle B (test with 8GB Ram model)
 - Micro SD Card for Raspberry Pi 4 Modèle B
 - 4G USB Key (test with Huawei E3372)
 - SIM card with 4G
 - Carlinkit (test with CPC200)
 - USB keyboard
 - Micro-HDMI to HDMI
 - Ethernet with internet
 - USB-C Cable for power supply.


OS Installation | Debian
------

Insert the Micro SD Card into your computer.


First download [Raspberry Pi OS Downloader](https://www.raspberrypi.com/software/), install and run it.



For OS select => `Raspberry Pi OS Other` => `Raspberry Pi OS Lite (64-bit)`

Select your memory card and click `Write`

Prepare your 4G dongle on another device, setting up the pin code is all it takes to get the 4G dongle ready to work.


You can now insert your Micro SD Card in your Raspberry Pi, connect a keyboard, ethernet cable, 4G Dongle as well as a screen. Then the power cable. Wait while Debian starts up.

user : `pi`
password : `raspberry`


You are now connected to a command terminal, with that we will be able to control your Raspberry Pi.

Attention the keyboard is a QWERTY! (It is not necessary to change, we have very little to do, adapt you)

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

Select `Localisation Options` => `Locale` => Select the right option
Select `Localisation Options` => `Timezone` => Select the right option
Select `Localisation Options` => `Keyboard` => Select the right option
Select `Localisation Options` => `WLAN Country` => Select the right option


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

Look at the ip address of your `eth0` ethernet interface :
```
ip a
```
It should look like 192.168.X.X or 10.X.X.X on eth0

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
systemctl restart hostapd
```

Your wifi network are ready, you should see it in the list of your wifi network on your pc or smartphone. However, this network does not have internet access at the moment.


Create DNS Zone | bind9
------

```
apt install bind9 -y
```

We are now going to configure the dns by editing this file `/etc/bind/db.carplay.lan`

For that we will use the `nano` text editor :

```
nano /etc/bind/db.carplay.lan
```

You are going to paste this :
```
$TTL    604800
@       IN      SOA     ns.carplay.lan. root.carplay.lan. (
                        2           ; Serial
                        604800      ; Refresh
                        86400       ; Retry
                        2419200     ; Expire
                        604800 )    ; Negative Cache TTL
;
@       IN      NS      ns.carplay.lan.
ns      IN      A       192.168.0.254
carplay.lan. IN A       1.1.1.1
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`

(`1.1.1.1` is use for bypass tesla local ip blocking)

We also need to edit the following file to apply the configuration.
```
nano /etc/bind/named.conf.local
```

Add this below the comment :
```
zone "carplay.lan" {
    type master;
    file "/etc/bind/db.carplay.lan";
    notify no;
};
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`


We restart the software for the new configuration under apply with :

```
systemctl restart bind9
```


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
opt dns 192.168.0.254
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
-A PREROUTING -d 1.1.1.1/32 -i wlan0 -p tcp -m tcp --dport 80 -j DNAT --to-destination 192.168.0.254
-A PREROUTING -d 1.1.1.1/32 -i wlan0 -p udp -m udp --dport 80 -j DNAT --to-destination 192.168.0.254
-A POSTROUTING -o eth1 -j MASQUERADE
-A POSTROUTING -s 192.168.0.254/32 -p tcp -m tcp --dport 80 -j SNAT --to-source 1.1.1.1
-A POSTROUTING -s 192.168.0.254/32 -p udp -m udp --dport 80 -j SNAT --to-source 1.1.1.1
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

```
apt install nginx -y
```

We are now going to configure the nginx web server by editing this file `/etc/nginx/conf.d/carplay.conf`

We will use the `nano` text editor :

```
nano /etc/nginx/conf.d/carplay.conf
```

You are going to paste this :
```
server {
    server_name carplay.lan;
    listen [::]:80;
    listen 80;
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


We restart the software for the new configuration under apply with :
```
systemctl enable nginx
systemctl restart nginx
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`


Bluetooth connection | bluez-alsa
------

```
apt install bluez bluez-tools libglib2.0-dev libasound2-dev build-essential autoconf libbluetooth-dev libtool libsbc-dev libdbus-1-dev libspandsp-dev ffmpeg -y
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
ExecStart=/usr/lib/bluetooth/bluetoothd --noplugin=sap --plugin=a2dp
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

Go to your tesla in the bluetooth settings, to add a new device. Then select your rasberry, me it's called `BlueZ 5.55`

Answer us `yes` all the questions you ask the raspberry


The `trust` command will enable to auto-pair the device again later on. (replace the Bluetooth MAC address with that of your Tesla, it should be displayed when you have accepted the conncetion with `yes`)
```
trust AA:BB:CC:DD:EE:FF
exit
```

Now create this file `/etc/asound.conf` (replace the Bluetooth MAC address with that of your Tesla, it should be displayed when you have accepted the conncetion with `yes`)
```
pcm.mid {
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

We will now test the bluetooth:

```
wget http://cd.textfiles.com/10000soundssongs/WAV/BANJO.WAV
SDL_AUDIODRIVER="alsa" AUDIODEV="mid" ffplay -nodisp -vn -autoexit -i BANJO.WAV
```
This is the music of victory.

Setup on reboot, for this edit `/etc/environment`

```
SDL_AUDIODRIVER="alsa"
AUDIODEV="mid"
```


If auto-connecting does not work after reboot you may add the following line to `nano /etc/rc.local` before `exit`:

```
echo -e "power on\nconnect AA:BB:CC:DD:EE:FF\n quit"|bluetoothctl
```


Create Node Carplay Server | tesla-carplay
------
```
apt install git libudev-dev ffmpeg -y
curl -fsSL https://deb.nodesource.com/setup_17.x | bash -
apt-get install -y nodejs
npm install -g npm@latest
npm i -g pm2
cd /root/
git clone https://github.com/marcdubois71450/tesla-carplay.git
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


Enjoy
------

- Reboot your raspberry so that everything starts correctly
- Connect your Tesla to the bluethoot of the raspberry from the bluetooth settings of the tesla
- Connect your Tesla to your Raspberry Wi-Fi
- Plug in your iPhone
- Open your browser to carplay.lan
- Enjoy


It was not easy, congratulations if it works, if you see bugs, or if you want to help the project, or if you simply have questions, it is with great pleasure. I'm still a beginner in ffmpeg and usb module for node, so it was not all repo! But it works!
