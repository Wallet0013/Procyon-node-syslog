const dgram = require('dgram');
// const debug = require('debug')('./syslogd');
const moment = require("moment");

module.exports = exports = Syslogd

function noop() {}

function Syslogd(fn, opt) {
    if (!(this instanceof Syslogd)) {
        return new Syslogd(fn, opt)
    }
    this.opt = opt || {}
    this.handler = fn
    this.server = dgram.createSocket('udp4')
}

const proto = Syslogd.prototype

proto.listen = function(port, cb) {
    const server = this.server
    if (this.port) {
        // debug('server has binded to %s', port)
        return
    }
    // debug('try bind to %s', port)
    cb = cb || noop
    this.port = port || 514 // default is 514
    const me = this
    server
        .on('error', function(err) {
            // debug('binding error: %o', err)
            cb(err)
        })
        .on('listening', function() {
            // debug('binding ok')
            cb(null)
        })
        .on('message', function(msg, rinfo) {
            const info = parser(msg, rinfo)
            me.handler(info)
        })
        .bind(port)

    return this
}

const Severity = {}
'Emergency Alert Critical Error Warning Notice Informational Debug'.split(' ').forEach(function(x, i) {
    Severity[x.toUpperCase()] = i
})

exports.Severity = Severity

const Facility = {} // to much

function parsePRI(raw) {
    // PRI means Priority, includes Facility and Severity
    // e.g. 10110111 =  10110: facility 111: severity
    const binary = (~~raw).toString(2)
    const facility = parseInt(binary.substr(binary.length - 3), 2)
    const severity = parseInt(binary.substring(0, binary.length - 3), 2)
    return [facility, severity]
}

function parser(msg, rinfo) {
    // https://tools.ietf.org/html/rfc5424
    // e.g. <PRI>time hostname tag: info
    msg = msg + ''
    const tagIndex = msg.indexOf(': ')
    const format = msg.substr(0, tagIndex)
    const priIndex = format.indexOf('>')
    let pri = format.substr(1, priIndex - 1)
    pri = parsePRI(pri)
    const lastSpaceIndex = format.lastIndexOf(' ')
    const tag = format.substr(lastSpaceIndex + 1)
    const last2SpaceIndex = format.lastIndexOf(' ', lastSpaceIndex - 1) // hostname cannot contain ' '
    const hostname = format.substring(last2SpaceIndex + 1, lastSpaceIndex)
    // time is complex because don't know if it has year
    let time = format.substring(priIndex + 1, last2SpaceIndex)
    time = new Date(time)
    time.setYear(new Date().getFullYear()) // fix year to now
    return {
            facility: pri[0],
            severity: pri[1],
            tag: tag,
            // , time: time
            time: moment().format(),
            hostname: hostname,
            address: rinfo.address,
            family: rinfo.family,
            port: rinfo.port,
            size: rinfo.size,
            msg: msg.substr(tagIndex + 2)
    }
}

exports.parser = parser
