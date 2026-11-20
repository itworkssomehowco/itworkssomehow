---
title: "La infraestructura de mi laboratorio casero"
date: 2026-04-28
categories: ["Embedded"]
tags: ["Raspberry PI", "Samba", "Tailscale", "NAS"]
readtime: 15
excerpt: "Una Pi 4, dos discos y la firme decisión de no pagar cada mes por un almacenamiento que ya tengo."
---

> La idea: una caja en un rincón de la habitación que no le deba una suscripción a nadie.

Todo empezó con las fotos. Las de toda una vida, repartidas entre móviles viejos, portátiles y un cajón lleno de CD y DVD. No había un sitio donde estuvieran de verdad, y encima las mismas fotos aparecían duplicadas en varias plataformas.

Tenía una Raspberry Pi 4 muerta de risa en un cajón. Así que el plan salió solo: una única máquina en casa que guarde los datos, a la que se pueda acceder desde fuera sin abrir puertos y que, una vez pagado el hardware, no cueste ni un euro al mes.

Lo que sigue es el diario de montaje hasta el momento en que, por fin, todo funciona.

## El problema

Hay dos requisitos, y el segundo es el que hace fracasar a la mayoría de los NAS caseros.

1. **El almacenamiento, aquí.** Archivos grandes en discos que tengo físicamente en casa.
2. **Acceso desde fuera.** Desde un portátil en una cafetería, no solo desde el sofá. Durante mucho tiempo esto me pareció imposible, hasta que descubrí Tailscale.

Hay un tercer requisito que no es del todo técnico: tiene que ser una sola caja. Nada de NAS más mini PC más hub. Un aparato y un cable de corriente.

## El hardware

- Raspberry Pi 4 de 4 GB
- Geekworm X880: una placa de expansión de USB 3.0 a doble SATA para discos de 2,5" o 3,5"
- Dos discos duros WD de 2 TB
- Arranque desde tarjeta SD
- Ethernet gigabit por cable. En la Pi 4 la tarjeta de red tiene su propio controlador y no cuelga del USB como en la 3B+, así que la velocidad por cable es más que decente
- Una carcasa impresa en 3D en ABS blanco, diseñada a medida para el conjunto (de ella hablo más abajo)

Algunos detalles del hardware que me hicieron perder tiempo.

**No alimentes los discos desde la Pi.** La Pi 4 solo entrega unos 1,2 A en total entre sus cuatro puertos USB. Dos discos alimentados por el bus sufrirán caídas de tensión durante escrituras largas, y el fallo no parece un problema de alimentación, sino un sistema de archivos corrupto. Acabas buscando el error donde no está. Por eso elegí el X880 y no dos cajas externas baratas: tiene su propia fuente de 12 V que alimenta los dos discos, y por el USB a la Pi solo pasan datos.

**Revisa el interruptor de RAID.** El X880 admite RAID por hardware. Yo lo tengo desactivado, así que la Pi ve dos discos independientes; en la siguiente sección explico por qué. Después de cambiar el modo, comprueba con `sudo fdisk -l` que aparecen los dos discos y con la capacidad correcta.

**Nada de escrituras en la tarjeta SD.** El sistema arranca desde una tarjeta SD, y estas tarjetas se desgastan con las escrituras constantes. En la tarjeta va solo el sistema operativo; las fotos, las carpetas compartidas y todo lo que escriba mucho van a los discos duros.

## La carcasa

No esperaba disfrutar con esta parte y, al final, fue el gran descubrimiento de todo el proyecto.

Para el X880 hay carcasas a la venta. Aun así me hice la mía, simplemente porque podía: tengo impresora 3D, me sobraba ABS y nunca había diseñado una carcasa desde cero. Entera se llevó 120 g de plástico.

**Primero, mídelo todo.** La Pi, el X880, los dos discos, los separadores, las curvas de los cables, por dónde salen los puertos y cuánto sitio necesita detrás el conector de corriente. Calibre, libreta y bastante más paciencia de la que creía. Cada milímetro que te saltes aquí te lo cobra después una tapa que no cierra.

**Modela el hardware, no la carcasa.** En Fusion 360 no empecé por la carcasa, sino por un modelo del conjunto ya montado: placas, discos y conectores como sólidos a tamaño real. Con eso hecho, la carcasa es solo una envolvente a su alrededor con algo de holgura, y todos los huecos para los puertos encajan porque salen directamente de la pieza a la que corresponden.

**Después, la caja.** Una envolvente alrededor del modelo, con algo de diseño para que parezca un objeto y no un cajón. Nada sofisticado: en el fondo sigue siendo una caja.

**Divídela para poder abrirla.** La carcasa tiene un cuerpo y unas tapas laterales desmontables, así que se llega a los discos y a la Pi sin desmontarlo todo. Cortar un sólido en Fusion es una sola operación; el verdadero trabajo de diseño es decidir *dónde* cortar para que cada pieza se imprima bien.

**Los agujeros, al final.** Los huecos de los puertos, los agujeros de fijación y las ranuras de ventilación los añadí al final, con la forma ya cerrada. Si los haces antes, te toca rehacerlos con cada cambio.

<!-- PHOTO: Fusion 360 — model of the stack inside the case -->

<!-- PHOTO: the assembled box, closed -->

<!-- PHOTO: inside the box — Pi 4, X880 and the two drives -->

Dos decisiones sobre la impresión:

**ABS, no PLA.** Dos discos que no paran nunca y una Pi 4 calientan el interior de una caja cerrada las veinticuatro horas, y el PLA empieza a ablandarse hacia los 60 °C. El ABS aguanta temperaturas que esta caja no debería alcanzar jamás.

**Ventilación con filtro.** Todas las ranuras llevan por dentro una malla fina antipolvo. Una caja en un rincón acumula polvo, y el polvo sobre los discos y la placa de la Pi es una muerte lenta pero segura. La pega es que una malla tan fina también deja pasar menos aire, y eso volverá a salir más adelante.

La lección que me llevo: primero se modela el objeto y luego la carcasa. Es el mismo enfoque que al trazar una PCB alrededor de conectores que tienen que coincidir con el exterior, y fue la primera vez que vi claro que el diseño mecánico y el diseño de placas son, en el fondo, el mismo tipo de problema.

## Sistema base

Raspberry Pi OS de 64 bits, grabado en la tarjeta SD con Raspberry Pi Imager. Desde los ajustes de Imager se pueden definir el nombre del equipo y el usuario y activar SSH antes del primer arranque, así que la caja no necesita monitor en ningún momento. Después, lo de siempre:

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y samba smartmontools
```

La Pi necesita una dirección fija. Puedes reservarla en el servidor DHCP del router o configurarla en la propia Pi. La versión actual de Raspberry Pi OS (Bookworm) gestiona la red con NetworkManager, así que toca usar `nmcli`:

```bash
nmcli con show                        # ver el nombre de la conexión por cable
sudo nmcli con mod "Wired connection 1" \
  ipv4.method manual \
  ipv4.addresses 192.168.1.10/24 \
  ipv4.gateway 192.168.1.1 \
  ipv4.dns 192.168.1.1
sudo nmcli con up "Wired connection 1"
```

Las direcciones son de ejemplo: pon las de tu subred. Yo prefiero la reserva en el DHCP, porque así las direcciones se deciden en un único sitio: el router.

Una costumbre que importa más que cualquier configuración: apágala como es debido. `sudo poweroff`, espera a que se apague el LED de actividad y solo entonces desenchufa. Casi todos los problemas de las secciones siguientes empezaron con un apagado brusco.

## Cómo están organizados los discos

ext4 en los dos. Nada de exFAT: no tiene journaling ni permisos POSIX, y montar Samba encima es buscarse problemas. Tampoco ZFS: necesita mucha más RAM de la que puede darle una Pi de 4 GB, y la gracia de todo esto es una caja modesta.

Los dos discos no forman un RAID ni son copia el uno del otro. Cada uno tiene su función y su dueño: un disco, una persona, una carpeta compartida. Los archivos de cada uno no se mezclan, los permisos son sencillos y cualquiera de los dos discos se puede desconectar y leer en cualquier ordenador con un puerto USB, cosa que no pasa con un disco sacado de un RAID.

Primero, mira qué ve la Pi:

```bash
lsblk -f                   # dispositivos, sistemas de archivos, etiquetas, UUID y puntos de montaje
sudo fdisk -l              # tamaños y tablas de particiones
```

Para un disco nuevo y vacío: una partición GPT que ocupe todo el disco y, encima, ext4 con una etiqueta. **Esto borra el disco**, así que comprueba dos veces que `/dev/sdX` es el que toca: `sda` y `sdb` pueden intercambiarse de un arranque a otro.

```bash
sudo parted /dev/sdX --script mklabel gpt mkpart primary ext4 0% 100%
sudo mkfs.ext4 -L disk1 /dev/sdX1
```

Este baile de nombres de dispositivo, de paso, adelanta la siguiente sección: en un disco USB lo único estable es el UUID.

## El problema del montaje

Al principio dejaba que el entorno de escritorio montara los discos automáticamente. Aparecían en `/media/<user>/` con el nombre de su etiqueta, Samba apuntaba a esas rutas y todo funcionaba… hasta que se apagó la caja.

Tras un apagado brusco, una de las carpetas compartidas empezó a responder «permission denied» a cada inicio de sesión. El disco estaba bien y los datos seguían ahí; lo que había cambiado era la ruta. El montaje automático había dejado un directorio vacío con el nombre del disco y propiedad de root, y en el siguiente arranque no quiso reutilizar ese nombre: montó el disco al lado, con un `1` al final. Samba seguía apuntando al nombre original, así que servía con todo su empeño un directorio vacío en el que no dejaba entrar a nadie.

El fondo del asunto es que los montajes de `/media/<user>/` pertenecen a la sesión de escritorio, no al sistema. Samba es un demonio: no debería depender de que haya alguien con la sesión iniciada ni de cómo decida llamar hoy al disco una utilidad del escritorio.

La solución fue quitarle el montaje al escritorio por completo y asociar cada disco a un único directorio mediante su UUID, que no cambia nunca, esté en el puerto que esté y diga lo que diga la etiqueta:

```bash
sudo blkid                 # anotar el UUID de cada disco
sudo mkdir -p /srv/disk1 /srv/disk2
```

Y en `/etc/fstab`:

```
UUID=<disk1-uuid>  /srv/disk1  ext4  defaults,nofail,x-systemd.device-timeout=10s  0 2
UUID=<disk2-uuid>  /srv/disk2  ext4  defaults,nofail,x-systemd.device-timeout=10s  0 2
```

Campo por campo: qué se monta, dónde, con qué sistema de archivos, las opciones, un indicador `dump` heredado que ya no usa nadie y el orden de comprobación de fsck; el `2` significa «comprobar al arrancar, después del sistema de archivos raíz».

`nofail` hace que un disco ausente o averiado no impida arrancar a la Pi: tendrás una caja sin esa carpeta compartida en vez de una caja colgada en el arranque y sin pantalla para ver qué pasa. `x-systemd.device-timeout=10s` acorta lo que el arranque espera a un disco que no está antes de darlo por perdido; por defecto es un minuto y medio.

Antes de reiniciar, revisa el archivo. Una errata en `fstab` es una de las pocas formas de conseguir que una Pi sin pantalla no vuelva a levantarse:

```bash
sudo findmnt --verify      # comprobar la sintaxis y la coherencia de /etc/fstab
sudo systemctl daemon-reload
sudo mount -a
findmnt /srv/disk1         # confirmar que está montado donde debe
```

Los puntos de montaje son de root, pero los datos de cada disco son de su dueño:

```bash
sudo chown -R <user1>: /srv/disk1
sudo chmod 0770 /srv/disk1
```

Desde entonces cada disco se monta siempre en el mismo directorio, el `path` de Samba apunta siempre a datos reales y el sufijo `1` no ha vuelto a aparecer.

## Samba

Samba porque la entiende todo el mundo: Windows, macOS y Linux montan carpetas SMB sin instalar nada. Lo importante de `/etc/samba/smb.conf`:

```ini
[global]
   server min protocol = SMB3
   server role = standalone server
   map to guest = never

[disk1]
   path = /srv/disk1
   valid users = <user1>
   read only = no
   create mask = 0660
   directory mask = 0770

[disk2]
   path = /srv/disk2
   valid users = <user2>
   read only = no
   create mask = 0660
   directory mask = 0770
```

`server min protocol = SMB3` no es un detalle menor. SMB1 es antiquísimo, tiene agujeros de seguridad conocidos y sigue activado en muchas configuraciones por defecto. Si una guía te dice que bajes la versión del protocolo para que los equipos «vean» el servidor, está resolviendo un problema de 2008 con quince años de retraso. La detección se arregla con una IP fija y un nombre de equipo.

Con `valid users` cada carpeta queda reservada a su dueño, así que el disco de una persona ni siquiera aparece desde la cuenta de la otra.

Los usuarios de Samba no son los mismos que los de Linux. Cada cuenta tiene que existir primero en el sistema y después recibir su propia contraseña de Samba:

```bash
sudo adduser <user1>
sudo smbpasswd -a <user1>
```

Repite con el segundo usuario y el segundo disco. Si te saltas `smbpasswd`, te encontrarás con una ventana de inicio de sesión que rechaza una y otra vez la contraseña correcta, y esa es una hora que no le deseo a nadie. `sudo pdbedit -L` te dice quién tiene de verdad contraseña de Samba.

Después de cada cambio en `smb.conf`:

```bash
testparm -s                          # analizar la configuración y mostrar los valores efectivos
sudo systemctl restart smbd
smbclient -L //localhost -U <user1>  # listar las carpetas como ese usuario, desde la propia Pi
```

Si `smbclient` funciona en la Pi y un cliente no, el problema está en la red o en el cliente, no en Samba. Para montar desde los clientes:

```bash
# Windows (cmd)
net use Z: \\<hostname>\disk1 /user:<user1>

# Linux
sudo mount -t cifs //<hostname>/disk1 /mnt/disk1 -o username=<user1>,vers=3.0
```

macOS: Finder → Ir → Conectarse al servidor → `smb://<hostname>/disk1`.

Por gigabit con cable, el techo ronda los 113 MB/s una vez descontado lo que consume el protocolo. Los archivos grandes leídos de corrido se acercan mucho; los pequeños, ni de lejos. Es lo que cuesta en SMB el ir y venir de peticiones por cada archivo, no que la Pi no dé más de sí, y ningún ajuste de configuración lo va a cambiar.

## Acceso desde fuera

Pensaba que esta sería la parte más difícil y resultó ser la más sencilla.

Nada de redirigir puertos. Nada de DNS dinámico. Nada de proxy inverso en un VPS alquilado. Tailscale monta una red WireGuard entre mis propios dispositivos, y cada uno recibe un nombre fijo dentro de una red privada que solo existe para mí. La Pi no pasa a ser accesible desde internet: pasa a ser accesible desde *mis otros dispositivos*, estén donde estén.

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

`tailscale up` muestra un enlace para iniciar sesión. Ábrelo en cualquier dispositivo, entra con tu cuenta y la Pi se une a la tailnet. El script de instalación activa el servicio `tailscaled`, así que vuelve a arrancar solo después de cada reinicio. Luego:

```bash
tailscale status           # todos los dispositivos de la tailnet y cómo están conectados
tailscale ip -4            # la dirección 100.x.y.z de la Pi
tailscale ping <laptop>    # si la conexión es directa o va por relay, y con qué latencia
```

Hay un ajuste de la consola de administración que conviene cambiar: desactivar la caducidad de la clave de la Pi. Por defecto, Tailscale obliga a todos los dispositivos conectados con una cuenta de usuario a volver a autenticarse cada 180 días, y una caja sin pantalla en un rincón no lo va a hacer sola: a los seis meses, más o menos, desaparecerá de la tailnet sin avisar. Se arregla en la página Machines: abre el menú de la Pi y elige «Disable key expiry». Los dispositivos con etiqueta son la excepción, porque sus claves no caducan por defecto. Y si la clave ya ha caducado, `sudo tailscale up --force-reauth` en la Pi la renueva.

Con MagicDNS activado, la Pi responde a un nombre fijo desde cualquier dispositivo de la tailnet, y la carpeta SMB se monta desde una cafetería exactamente igual que desde la habitación de al lado: más lenta, pero con la misma dirección. El plan personal gratuito cubre varios dispositivos, así que la regla de «cero suscripciones» se mantiene.

Eso sí, hay que decirlo claramente: es la única pieza del sistema que depende de un servicio ajeno. El servidor de coordinación es suyo. Los datos viajan directamente entre mis dispositivos y van cifrados de extremo a extremo, pero si me pongo estricto con lo de «cero nube», aquí está el asterisco. Headscale, la alternativa autoalojada, está en la lista de pendientes, no en el montaje.

## Cómo vigilarlo

Los discos exponen SMART a través del puente USB del X880, pero normalmente hay que indicarle a `smartctl` que pase los comandos:

```bash
sudo smartctl -d sat -H /dev/sda     # diagnóstico rápido de salud
sudo smartctl -d sat -a /dev/sda     # todo: sectores reasignados, horas de uso, temperatura
```

Las líneas que hay que vigilar son `Reallocated_Sector_Ct`, `Current_Pending_Sector` y `Offline_Uncorrectable`. Si no están a cero y van subiendo, el disco tiene los días contados, y se nota mucho antes de que falle del todo.

Un dato sobre el X880: según la propia wiki de Geekworm, la placa no tiene modo de reposo, así que los discos no se detienen cuando están inactivos. Eso supone más desgaste y algo más de calor, y por eso la temperatura importa.

Para la Pi:

```bash
vcgencmd measure_temp      # temperatura del SoC
vcgencmd get_throttled     # 0x0: ni bajada de frecuencia ni caída de tensión desde el arranque
```

Si `get_throttled` devuelve algo distinto de `0x0`, merece la pena descifrarlo: los bits bajos indican que el problema está ocurriendo ahora y los altos, que ha ocurrido desde el arranque. Los avisos de tensión baja, sobre todo, señalan directamente a la fuente de alimentación.

## Lo siguiente

Una refrigeración en condiciones. Ahora mismo la caja depende de la ventilación pasiva por ranuras con filtro, y un filtro que no deja entrar el polvo tampoco deja entrar parte del aire. La Pi 4 empieza a bajar la frecuencia a los 80 °C, y una caja impresa y cerrada con dos discos que no paran nunca es la manera perfecta de llegar ahí.

El plan es un ventilador de 40×40 mm, pero no uno que vaya a tope todo el día. Un ventilador siempre encendido es, casi siempre, ruido y desgaste sin motivo, y un simple umbral de encendido y apagado lo hace encenderse y apagarse una y otra vez alrededor del punto de disparo. En su lugar llevará control de velocidad por PWM con un lazo PID: mientras todo esté frío, se queda quieto; arranca solo cuando se calientan la Pi o los discos, y gira justo lo necesario para mantener la temperatura objetivo.

Las entradas ya existen: son lo que leen los comandos de la sección anterior.

```bash
cat /sys/class/thermal/thermal_zone0/temp       # SoC de la Pi en milésimas de grado: 52000 = 52 °C
sudo smartctl -d sat -A /dev/sda | grep -i temp # temperatura del disco según SMART
```

El lazo se fija en cuál de los dos está más cerca de su propio límite, así que un disco caliente puede encender el ventilador aunque la Pi esté fría, y al revés. Al lado irán sensores de temperatura y humedad dentro de la caja, con registro local, para ver qué hace de verdad el ventilador en lugar de suponerlo.

Con eso, la caja dejará de ser solo almacenamiento y empezará a medir su propio entorno. Más o menos ahí es donde esto deja de ser un NAS y pasa a ser un laboratorio casero.

## Conclusión

Lo interesante de verdad no estaba en el almacenamiento. Samba es un problema resuelto desde hace veinte años, y ext4 no necesita mi opinión.

Lo interesante llegó cuando «accesible desde fuera» y «sin puertos abiertos» dejaron de contradecirse. Pasó en el momento en que dejé de pensar en cómo exponer un servidor a internet y empecé a pensar en cómo unir mis propios dispositivos en una red privada. A partir de ahí, el acceso remoto dejó de ser un problema: la solución no era abrir una puerta nueva, sino dejar de necesitarla.

Una caja. Un cable de corriente. Ninguna factura mensual. Y sigue funcionando.
