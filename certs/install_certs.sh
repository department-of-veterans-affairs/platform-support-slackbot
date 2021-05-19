#!/usr/bin/env bash
set -euo pipefail

#
# Install the following VA certs. Place then a location that is easily
# shared and in the system trust.
# Other tools, like install Java, can simply just look for any
# files in $ADDITIONAL_CA_CERTS to install.
#
CA_CERTS=(
  http://aia.pki.va.gov/PKI/AIA/VA/VA-Internal-S2-RCA1-v1.cer
  http://aia.pki.va.gov/PKI/AIA/VA/VA-Internal-S2-ICA4.cer
  http://aia.pki.va.gov/PKI/AIA/VA/VA-Internal-S2-ICA5.cer
  http://aia.pki.va.gov/PKI/AIA/VA/VA-Internal-S2-ICA6.cer
  http://aia.pki.va.gov/PKI/AIA/VA/VA-Internal-S2-ICA7.cer
  http://aia.pki.va.gov/PKI/AIA/VA/VA-Internal-S2-ICA8.cer
  http://aia.pki.va.gov/PKI/AIA/VA/VA-Internal-S2-ICA9.cer
)

if [ ! -d $ADDITIONAL_CA_CERTS ]; then mkdir -p $ADDITIONAL_CA_CERTS; fi

ANCHORS=/usr/local/share/ca-certificates/
for CERT in ${CA_CERTS[@]}
do
  echo "Installing $CERT"
  OUT=$ADDITIONAL_CA_CERTS/${CERT##*/}
  test 200 == "$(curl -sw %{http_code} $CERT -o $OUT)"
done
for cert in $(find $ADDITIONAL_CA_CERTS -type f -name "*.cer")
  do
    echo "Combining $cert"
    openssl x509 -inform der -in $cert -out $cert.pem
  done
chmod 0444 $cert.pem
echo "Combined CA certs to $cert.pem"

cp $ADDITIONAL_CA_CERTS/*.pem $ANCHORS

update-ca-certificates
