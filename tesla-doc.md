
## Installation guide for tesla navigator


We are going to create a Wifi networks from a rabesperry and a 4G chip. Tesla will connect to this WiFi networks, and carplay will be available through a website hosted on the rabeberry in the tesla browser.


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

First [download debian](https://raspi.debian.net/tested-images/) for the Raspberry Pi, download `xz-compressed image` (Release: `11, (Bullseye)`, Family: `4`, Tested hardware: `4 (4GB)`) (No matter the size of your ram choose Tested hardware: `4 (4GB)` memory size automatically adapt)

You now have this file `20210823_raspi_4_bullseye.img.xz` (the date may be different).

Unzip the file, now have this file `20210823_raspi_4_bullseye.img`

We will now put it on the Micro SD Card so that the raspberry can start on Debian.

Insert the Micro SD Card into your computer.

We will now be able to install debian on the Micro SD Card, for this you will need to [download the Win32 Disk Imager](https://sourceforge.net/projects/win32diskimager/) software and install it.

Open Win32 Disk Imager, then in the `Image File` box selected `20210823_raspi_4_bullseye.img`. Then in `Device` box, select the letter of your Micro SD Card. Click on Write. Then wait while loading. Debian is now installed on your Micro SD card.

On linux/macOS you can use [balenaEtcher](https://www.balena.io/etcher/), launch it, click `Flash from file` select your file `20210823_raspi_4_bullseye.img`, click `Select target` select your Micro SD Card, end click `Flash!`

You can now insert your Micro SD Card in your Raspberry Pi, connect a keyboard, ethernet cable as well as a screen. Then the power cable. Wait while Debian starts up.


user : `root`


You are now connected to a command terminal, with that we will be able to control your rasberry.

Attention the keyboard is a QWERTY! (It is not necessary to change, we have very little to do, adapt you)

First, we will make all the updates available. (Typing is command followed by entering)

```
apt install update
apt install upgrade -y
apt install curl unzip -y
```

Enable SSH
------
We will define a password for our user `root`, Use `root` as the password. (user: `root`, password: `root`)

```
passwd root
```
It is normal that nothing is displayed when you type your password. You just have to press Enter when you have finished typing it.

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
It should look like 192.168.X.X or 10.X.X.X

At home I received this ip address 192.168.1.68, yours will certainly be different.

We will now be able to leave the raspberry aside, and access it remotely using ssh. This will make it easier for us to copy paste.

For this on windows [download Putty](https://www.putty.org/) software and install it.

Open Putty, in `Host Name (or IP address)` set your ip (me it's 192.168.1.68) (Port: `22`, Connection type: `SSH`) and click `Open`

Enter username and password (user: `root`, password: `root`)

You should now be connected to a terminal of your rasberry.


Creation of the Wifi network | hostapd
------

At first we will create the wifi networks thanks to the wifi antenna integrated in the Rasberry Pi.

We configure the wifi interface. For that we will use the `nano` text editor :

```
nano /etc/network/interfaces.d/wlan0
```

Add this below the comment :
```
auto wlan0
iface wlan0 inet static
   address 192.168.0.254/24
#   up iptables-restore < /etc/iptables.ipv4.nat
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`


We apply the configuration:
```
systemctl restart networking
```


Now we should see the ip address `192.168.0.254` on `wlan0` with this command:

```
ip a
```

We install the software  `hostapd` that will allow us to create a Wifi networks:
```
apt install hostapd
```

We are now going to configure the wifi networks by editing this file `/etc/hostapd/hostapd.conf`

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
wpa_passphrase=AMAZING-WIFI-PASSWORD
```
You can now save the file with `CTRL + O` then `Enter`. And quit `nano` text editor with `CTRL + X`

We restart the software for the new configuration under apply with :

```
systemctl restart hostapd
```

Your wifi network are ready, you should see it in the list of your wifi network on your pc or smartphone. However, this network does not have internet access at the moment.



.............
