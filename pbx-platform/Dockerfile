FROM ubuntu:24.04

LABEL maintainer="사용자 계정"

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Seoul

RUN apt-get update && apt-get install -y \
    wget curl build-essential git subversion \
    libnewt-dev libssl-dev libncurses5-dev \
    libsqlite3-dev libjansson-dev libxml2-dev \
    uuid-dev bison flex aptitude tzdata \
    libedit-dev libtool libdaemon-dev libasound2-dev \
    libogg-dev libvorbis-dev libspeex-dev \
    libspeexdsp-dev libgsm1-dev libsrtp2-dev \
    libpq-dev \
    vim openssh-server \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir /var/run/sshd
RUN echo 'root:{비밀번호}' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

WORKDIR /usr/src
RUN wget http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz \
    && tar zxf asterisk-20-current.tar.gz \
    && rm asterisk-20-current.tar.gz

RUN cd asterisk-20.*/ && \
    ./configure --with-jansson-bundled && \
    make menuselect.makeopts && \
    menuselect/menuselect --enable res_config_pgsql menuselect.makeopts && \
    make -j$(nproc) && \
    make install && \
    make samples && \
    make config

EXPOSE 22 5060/udp 10000-10100/udp

CMD service ssh start && /usr/sbin/asterisk -fvvvin
