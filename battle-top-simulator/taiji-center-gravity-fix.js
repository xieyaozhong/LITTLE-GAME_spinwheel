/* Taiji centre-gravity compliance: preserve the arena bowl's inward pull */
(() => {
  const PriorTop = Top;

  function centreState(top) {
    const cx = W / 2, cy = H / 2;
    const dx = top.x - cx, dy = top.y - cy;
    const distance = mag(dx, dy) || 1;
    return { nx: dx / distance, ny: dy / distance, distance };
  }

  function bowlAcceleration(top, distance) {
    let slope;
    if (distance <= innerR) {
      const q = clamp(distance / innerR, 0, 1);
      slope = 0.06 * q + 0.46 * q * q * q;
    } else {
      const q = clamp((distance - innerR) / Math.max(1, outerR - innerR), 0, 1);
      slope = 0.42 + 0.62 * q * q;
    }
    const contact = 1 - clamp(top.lift || 0, 0, 0.78);
    return PHYS.bowlG * slope * contact;
  }

  function validEnemy(source, target) {
    const team = top => top?.teamIndex ?? (top?.index ? 1 : 0);
    return !!target && source !== target && team(source) !== team(target) && !target.out && !target.burst && target.energy > 0;
  }

  Top = class Top extends PriorTop {
    update(dt, opponent) {
      if (!this.c?.taijiV2) {
        super.update(dt, opponent);
        return;
      }

      const before = centreState(this);
      const radialBefore = this.vx * before.nx + this.vy * before.ny;
      const modeBefore = this.taijiMode;

      super.update(dt, opponent);
      if (this.out || this.burst || this.phaseInvisible || this.skyJumpGhost) return;

      /*
       * The original Yin behaviour adds an artificial orbit around the opponent.
       * Remove that steering impulse here so it cannot visually cancel the bowl pull.
       */
      if (modeBefore === 'yin' && validEnemy(this, opponent)) {
        const dx = opponent.x - this.x, dy = opponent.y - this.y;
        const d = mag(dx, dy) || 1;
        const sign = Math.sign(this.omega) || 1;
        this.vx -= (-dy / d) * sign * 7 * dt;
        this.vy -= (dx / d) * sign * 7 * dt;
      }

      /*
       * Guarantee at least one normal arena-gravity impulse survives all Taiji
       * movement corrections. This does not teleport the top or lock it to centre;
       * it only restores the inward radial velocity change expected from the bowl.
       */
      const now = centreState(this);
      const expectedPull = bowlAcceleration(this, now.distance) * dt;
      const radialNow = this.vx * now.nx + this.vy * now.ny;
      const targetRadial = radialBefore - expectedPull;
      if (radialNow > targetRadial) {
        const correction = radialNow - targetRadial;
        this.vx -= now.nx * correction;
        this.vy -= now.ny * correction;
      }

      this.taijiGravityActive = true;
    }
  };

  document.documentElement.dataset.taijiGravity = 'active';
})();
