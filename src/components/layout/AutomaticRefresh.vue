<script setup>
let txt = null
const { upTime = 1000 } = defineProps({
    upTime: {
        type: Number,
        required: true,
    },
})
if (window.__dirname) {
    let fs = require('fs')
    setInterval(function () {
        let _txt = fs.readFileSync(__dirname + '/' + 'index.html', 'utf-8')
        if (txt == null) {
            txt = _txt
            return
        }
        if (txt != _txt) {
            window.location.reload()
        }
    }, upTime)
}
</script>
