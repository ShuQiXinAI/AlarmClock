package expo.modules.alarmsound

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AlarmSoundModule : Module() {

  private var player: MediaPlayer? = null

  override fun definition() = ModuleDefinition {
    Name("AlarmSound")

    Function("play") {
      playInternal()
    }

    Function("stop") {
      stopInternal()
    }
  }

  private fun playInternal() {
    stopInternal()
    val ctx = appContext.reactContext ?: return

    val uri: Uri =
      RingtoneManager.getActualDefaultRingtoneUri(ctx, RingtoneManager.TYPE_ALARM)
        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
        ?: return

    val attrs = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()

    try {
      player = MediaPlayer().apply {
        setDataSource(ctx, uri)
        setAudioAttributes(attrs)
        isLooping = true
        setOnPreparedListener { it.start() }
        setOnErrorListener { mp, _, _ ->
          try { mp.release() } catch (_: Exception) {}
          if (player === mp) player = null
          true
        }
        prepareAsync()
      }

      // Bump alarm volume off zero so the alarm is audible even if the
      // user accidentally muted the alarm slider.
      val am = ctx.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
      am?.let {
        val current = it.getStreamVolume(AudioManager.STREAM_ALARM)
        val max = it.getStreamMaxVolume(AudioManager.STREAM_ALARM)
        if (current == 0 && max > 0) {
          val target = (max * 0.6).toInt().coerceAtLeast(1)
          it.setStreamVolume(AudioManager.STREAM_ALARM, target, 0)
        }
      }
    } catch (_: Exception) {
      stopInternal()
    }
  }

  private fun stopInternal() {
    player?.let { mp ->
      try { mp.stop() } catch (_: Exception) {}
      try { mp.reset() } catch (_: Exception) {}
      try { mp.release() } catch (_: Exception) {}
    }
    player = null
  }
}
